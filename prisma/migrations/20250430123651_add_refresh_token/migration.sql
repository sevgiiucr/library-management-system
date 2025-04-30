/*
  Warnings:

  - You are about to alter the column `imageUrl` on the `Book` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.
  - You are about to alter the column `profileImageUrl` on the `User` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `Text`.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Book] ALTER COLUMN [imageUrl] TEXT NULL;

-- AlterTable
ALTER TABLE [dbo].[User] ALTER COLUMN [profileImageUrl] TEXT NULL;
ALTER TABLE [dbo].[User] ADD [refreshToken] TEXT;

-- CreateTable
CREATE TABLE [dbo].[Favorite] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [bookId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Favorite_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Favorite_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Favorite_userId_bookId_key] UNIQUE NONCLUSTERED ([userId],[bookId])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] TEXT,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Category_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[BookCategory] (
    [bookId] NVARCHAR(1000) NOT NULL,
    [categoryId] NVARCHAR(1000) NOT NULL,
    [assignedAt] DATETIME2 NOT NULL CONSTRAINT [BookCategory_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BookCategory_pkey] PRIMARY KEY CLUSTERED ([bookId],[categoryId])
);

-- AddForeignKey
ALTER TABLE [dbo].[Favorite] ADD CONSTRAINT [Favorite_bookId_fkey] FOREIGN KEY ([bookId]) REFERENCES [dbo].[Book]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Favorite] ADD CONSTRAINT [Favorite_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[BookCategory] ADD CONSTRAINT [BookCategory_bookId_fkey] FOREIGN KEY ([bookId]) REFERENCES [dbo].[Book]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[BookCategory] ADD CONSTRAINT [BookCategory_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
