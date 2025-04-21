/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Book] ADD [available] BIT NOT NULL CONSTRAINT [Book_available_df] DEFAULT 1,
[imageUrl] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[User] ADD [password] NVARCHAR(1000) NOT NULL,
[profileImage] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[Borrow] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [bookId] NVARCHAR(1000) NOT NULL,
    [borrowDate] DATETIME2 NOT NULL CONSTRAINT [Borrow_borrowDate_df] DEFAULT CURRENT_TIMESTAMP,
    [returnDate] DATETIME2,
    CONSTRAINT [Borrow_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Borrow] ADD CONSTRAINT [Borrow_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Borrow] ADD CONSTRAINT [Borrow_bookId_fkey] FOREIGN KEY ([bookId]) REFERENCES [dbo].[Book]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
