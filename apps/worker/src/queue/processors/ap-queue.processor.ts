import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { logger } from '@common/automation';
import { WorkflowService } from '../../workflow/workflow.service';
import { ConnectorService } from '../../connector/connector.service';
import { NotificationService } from '../../notification/notification.service';

@Processor('ap-queue')
export class ApQueueProcessor {
  constructor(
    private prisma: PrismaService,
    private workflowService: WorkflowService,
    private connectorService: ConnectorService,
    private notificationService: NotificationService,
  ) {}

  @Process('process-invoice')
  async processInvoice(job: Job<{
    runId: string;
    workflowId: string;
    input: any;
  }>) {
    const { runId, workflowId, input } = job.data;

    logger.info(`Processing AP invoice for run ${runId}`);

    try {
      // Update run status
      await this.prisma.run.update({
        where: { id: runId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      // Step 1: Ingest Email
      const ingestStep = await this.createRunStep(runId, 'ingest', 'Ingest Email');
      const emailData = await this.ingestEmail(input.emailId);
      await this.completeRunStep(ingestStep.id, emailData);

      // Step 2: OCR Extract
      const ocrStep = await this.createRunStep(runId, 'ocr', 'Extract Text');
      const ocrData = await this.extractText(emailData.attachments);
      await this.completeRunStep(ocrStep.id, ocrData);

      // Step 3: Normalize Data
      const normalizeStep = await this.createRunStep(runId, 'normalize', 'Normalize Data');
      const normalizedData = await this.normalizeInvoiceData(ocrData);
      await this.completeRunStep(normalizeStep.id, normalizedData);

      // Step 4: 2/3-Way Match
      const matchStep = await this.createRunStep(runId, 'match', '2/3-Way Match');
      const matchResult = await this.performMatch(normalizedData);
      await this.completeRunStep(matchStep.id, matchResult);

      // Step 5: Check if approval is needed
      if (matchResult.requiresApproval) {
        await this.createApproval(runId, matchStep.id, matchResult);
        await this.prisma.run.update({
          where: { id: runId },
          data: { status: 'NEEDS_APPROVAL' },
        });
        return;
      }

      // Step 6: Generate Payment
      const paymentStep = await this.createRunStep(runId, 'payment', 'Generate Payment');
      const paymentData = await this.generatePayment(normalizedData, matchResult);
      await this.completeRunStep(paymentStep.id, paymentData);

      // Complete the run
      await this.prisma.run.update({
        where: { id: runId },
        data: {
          status: 'SUCCEEDED',
          finishedAt: new Date(),
          output: {
            invoiceNumber: normalizedData.invoiceNumber,
            vendor: normalizedData.vendor,
            amount: normalizedData.amount,
            poNumber: matchResult.poNumber,
            matchStatus: matchResult.status,
            paymentFile: paymentData.fileName,
          },
        },
      });

      logger.info(`AP invoice processing completed for run ${runId}`);

    } catch (error) {
      logger.error(`AP invoice processing failed for run ${runId}:`, error);
      
      await this.prisma.run.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          error: error.message,
        },
      });
    }
  }

  private async createRunStep(runId: string, stepId: string, name: string) {
    return this.prisma.runStep.create({
      data: {
        runId,
        name,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
  }

  private async completeRunStep(stepId: string, output: any) {
    return this.prisma.runStep.update({
      where: { id: stepId },
      data: {
        status: 'SUCCEEDED',
        finishedAt: new Date(),
        metrics: { output },
      },
    });
  }

  private async ingestEmail(emailId: string) {
    // In a real implementation, you would:
    // 1. Connect to Gmail/Outlook
    // 2. Fetch the email
    // 3. Download attachments
    // 4. Store in S3

    logger.info(`Ingesting email ${emailId}`);
    
    // Simulate email ingestion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      subject: 'Invoice #INV-2024-001',
      from: 'billing@vendor.com',
      attachments: [
        {
          name: 'invoice.pdf',
          url: 's3://automation-artifacts/invoices/invoice-2024-001.pdf',
          size: 245760,
        },
      ],
    };
  }

  private async extractText(attachments: any[]) {
    // In a real implementation, you would:
    // 1. Download the PDF from S3
    // 2. Use OCR (Tesseract or cloud service)
    // 3. Extract structured data

    logger.info(`Extracting text from ${attachments.length} attachments`);
    
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      invoiceNumber: 'INV-2024-001',
      vendor: 'Vendor Corp',
      amount: 1500.00,
      currency: 'USD',
      date: '2024-01-15',
      lineItems: [
        { description: 'Software License', quantity: 1, unitPrice: 1500.00, total: 1500.00 },
      ],
      confidence: 0.95,
    };
  }

  private async normalizeInvoiceData(ocrData: any) {
    // In a real implementation, you would:
    // 1. Validate the extracted data
    // 2. Normalize formats
    // 3. Apply business rules

    logger.info(`Normalizing invoice data for ${ocrData.invoiceNumber}`);
    
    return {
      invoiceNumber: ocrData.invoiceNumber,
      vendor: ocrData.vendor,
      amount: ocrData.amount,
      currency: ocrData.currency,
      date: new Date(ocrData.date),
      lineItems: ocrData.lineItems,
      confidence: ocrData.confidence,
    };
  }

  private async performMatch(normalizedData: any) {
    // In a real implementation, you would:
    // 1. Look up PO by invoice number
    // 2. Check GRN (Goods Received Note)
    // 3. Calculate match percentage
    // 4. Determine if approval is needed

    logger.info(`Performing 2/3-way match for ${normalizedData.invoiceNumber}`);
    
    // Simulate matching process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const matchPercentage = 0.98;
    const requiresApproval = normalizedData.amount > 1000 || matchPercentage < 0.95;
    
    return {
      poNumber: 'PO-2024-001',
      matchPercentage,
      status: matchPercentage >= 0.95 ? 'matched' : 'partial',
      requiresApproval,
      grnStatus: 'received',
      variance: 0.02,
    };
  }

  private async createApproval(runId: string, stepId: string, matchResult: any) {
    // In a real implementation, you would:
    // 1. Determine approvers based on amount
    // 2. Send email notifications
    // 3. Create approval record

    logger.info(`Creating approval for run ${runId}`);
    
    await this.prisma.approval.create({
      data: {
        runId,
        stepId,
        approverEmail: 'manager@acme.com',
        approverName: 'Manager User',
        reason: `Invoice requires approval due to amount: $${matchResult.amount}`,
        slaHours: 24,
        orgId: 'demo-org-1',
        createdBy: 'system',
      },
    });

    // Send notification
    await this.notificationService.sendApprovalNotification({
      approverEmail: 'manager@acme.com',
      runId,
      invoiceNumber: matchResult.invoiceNumber,
      amount: matchResult.amount,
    });
  }

  private async generatePayment(normalizedData: any, matchResult: any) {
    // In a real implementation, you would:
    // 1. Generate ACH/SEPA file
    // 2. Create remittance PDF
    // 3. Upload to S3

    logger.info(`Generating payment for ${normalizedData.invoiceNumber}`);
    
    // Simulate payment generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      fileName: 'payment-ach-001.txt',
      fileUrl: 's3://automation-artifacts/payments/payment-ach-001.txt',
      amount: normalizedData.amount,
      vendor: normalizedData.vendor,
      poNumber: matchResult.poNumber,
    };
  }
}