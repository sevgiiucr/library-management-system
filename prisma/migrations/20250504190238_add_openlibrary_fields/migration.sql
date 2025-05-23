BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Book] ADD [addedBy] NVARCHAR(1000),
[description] TEXT,
[externalId] NVARCHAR(1000),
[isbn] NVARCHAR(1000),
[language] NVARCHAR(1000),
[publisher] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
