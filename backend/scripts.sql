CREATE TABLE order_master (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
store INT DEFAULT 13 NOT NULL,  
    pickslip_number VARCHAR(50) NOT NULL,
pickslip_line_id INT NOT NULL,
    item_code VARCHAR(50) NOT NULL,
batch_number VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
order_date DATETIME DEFAULT GETDATE(),
customer_name VARCHAR(100) NOT NULL,  
    customer_number VARCHAR(20) NOT NULL,
    pickslip_status VARCHAR(20) DEFAULT 'Pending',
	trans_date datetime default getdate() null,
	invoice_number VARCHAR(255) NULL, 
	reference VARCHAR(255) NULL,
make varchar(255)
)
----------------------------------------------------------
CREATE TABLE order_master_status (
    pickslip_number NVARCHAR(50) NULL,
    pickslip_status NVARCHAR(50) NULL
);
------------------------------------------------
CREATE TABLE order_master_log (
    order_id INT not null,
store INT DEFAULT 13 NOT NULL,  
    pickslip_number VARCHAR(50) NOT NULL,
pickslip_line_id INT NOT NULL,
    item_code VARCHAR(50) NOT NULL,
batch_number VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
order_date DATETIME not null,
customer_name VARCHAR(100) NOT NULL,  
    customer_number VARCHAR(20) NOT NULL,
    pickslip_status VARCHAR(20) not null,
created_at datetime default getdate() not null,
invoice_number varchar(255),
make varchar(255)
)  
----------------------------------------------------
CREATE TABLE [dbo].[issued_stock_table](
[issued_id] [int] IDENTITY(1,1) NOT NULL,
[pickslip_number] [varchar](50) NOT NULL,
pickslip_line_id int null,
[item_code] [varchar](50) NOT NULL,
[issued_quantity] [int] NOT NULL,
[batch_number] [varchar](50) NOT NULL,
[bin_location] [varchar](50) NOT NULL,
[issued_at] [datetime] Default getdate() NOT NULL,
[status] VARCHAR(20) NULL,
customer_name VARCHAR(225) NOT NULL,
 invoice_number varchar(255),
make varchar(255)
)
-----------------------------------------------------
CREATE TABLE receipt_master (
    receipt_id INT IDENTITY(1,1) PRIMARY KEY,
	store INT DEFAULT 13 NOT NULL,
    receipt_number VARCHAR(50) NOT NULL,
	receipt_date DATETIME DEFAULT GETDATE() NOT NULL,
	batch_number VARCHAR(50) NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    expiry_date DATE NULL,
    status VARCHAR(20) DEFAULT 'Pending',
	[supplier_name] [varchar](255) NULL,
trans_date datetime default getdate() null,
	invoice_number VARCHAR(255) NULL, 
	reference VARCHAR(255) NULL,
	make varchar(255)
);
-----------------------------------------------------
CREATE TABLE receipt_master_log (
    receipt_id INT NOT NULL,
	store INT NOT NULL,
    receipt_number VARCHAR(50) NOT NULL,
	receipt_date DATETIME NOT NULL,
	batch_number VARCHAR(50) NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    expiry_date DATE NULL,
	[supplier_name] [varchar](255) NULL,
	created_at datetime default getdate() not null,
    trans_date datetime default getdate() null,
	invoice_number VARCHAR(255) NULL, 
	reference VARCHAR(255) NULL,
	make varchar(255)
);
-----------------------------------------------
CREATE TABLE [dbo].[receipt_master_status](
	[receipt_number] [varchar](255) NOT NULL,
	[receipt_status] [varchar](255) NULL,
	[receipt_type] [varchar](255) NULL,
	[receipt_comment] [varchar](max) NULL,
)
-----------------------------------------------------------
CREATE TABLE [dbo].[allocation_table](
	[allocation_id] [int] IDENTITY(1,1) NOT NULL,
	[batch_number] [varchar](50) NOT NULL,
	[bin_location] [varchar](50) NOT NULL,
	[allocated_quantity] [int] NOT NULL,
	[created_at] [datetime] NULL,
	[quantity] [int] NOT NULL,
	[item_code] [varchar](50) NOT NULL,
	[item_description] [varchar](255) NOT NULL,
	[item_category] [varchar](100) NOT NULL,
	[receipt_number] [varchar](50) NOT NULL,
	[store] [int] NOT NULL,
	[expiry_date] [date] NULL,
	supplier_name VARCHAR(255) not null,
        make varchar(255)
)
-----------------------------------------------------------

CREATE TABLE [dbo].[adjustment_table] (
    [type] VARCHAR(50) NOT NULL,
    [line_id] INT NULL,
    [item_code] VARCHAR(50) NOT NULL,
    [batch_number] VARCHAR(50) NOT NULL,
    [bin_location] VARCHAR(50) NOT NULL,
    [quantity] INT NOT NULL,
    [status] VARCHAR(20) NOT NULL,
[created_at] DATETIME DEFAULT GETDATE() NOT NULL,
make varchar(255)
);

----------------------------------------------

CREATE TABLE [dbo].[transfer_table](
[bin_location] [varchar](255) NOT NULL,
[batch_number] [varchar](50) NOT NULL,
[item_code] [varchar](50) NOT NULL,
[available_quantity] [int] NOT NULL,
[new_bin_location] [varchar](50) NOT NULL,
[new_allocated_qty] [int] NOT NULL,
[transfer_date] [datetime] DEFAULT GETDATE() NOT NULL,
make varchar(255)
)
--------------------------------------------------

CREATE  TABLE [dbo].[holding_table] (
    [pickslip_number] VARCHAR(50) NOT NULL,
    [pickslip_line_id] INT NULL,
    [item_code] VARCHAR(50) NOT NULL,
	ordered_qty INT NOT NULL,
	issued_qty INT NOT NULL,
	remaining_qty INT NOT NULL,
    [batch_number] VARCHAR(50) NOT NULL,
    [bin_location] VARCHAR(50) NOT NULL,
    [new_bin_location] VARCHAR(50) NULL,
    [new_allocated_qty] INT NULL,
    [issued_at] DATETIME NOT NULL,
    [status] VARCHAR(20) NULL,
	[created_at] DATETIME DEFAULT GETDATE() NOT NULL,
	customer_name VARCHAR(255) NOT NULL,
invoice_number varchar(255),
make varchar(255)
);
---------------------------------------
CREATE TABLE [dbo].[reserve_table](
    [receipt_number] [varchar](255) NOT NULL,
    [receipt_status] [varchar](255) NULL,
    [receipt_type] [varchar](255) NULL,
    [receipt_comment] [varchar](max) NULL,
    [created_at] [datetime] NOT NULL DEFAULT GETDATE()
);
-------------------------------
CREATE TABLE report_table (
    id INT IDENTITY(1,1) PRIMARY KEY,
    menu NVARCHAR(255),
    sub_menu NVARCHAR(255),
    report_name NVARCHAR(255),
    report_query NVARCHAR(MAX),
    filter1 NVARCHAR(255),
    filter1_type NVARCHAR(100),
    filter2 NVARCHAR(255),
    filter2_type NVARCHAR(100),
    filter3 NVARCHAR(255),
    filter3_type NVARCHAR(100),
    filter4 NVARCHAR(255),
    filter4_type NVARCHAR(100),
    filter5 NVARCHAR(255),
    filter5_type NVARCHAR(100),
    filter6 NVARCHAR(255),
    filter6_type NVARCHAR(100),
    filter7 NVARCHAR(255),
    filter7_type NVARCHAR(100),
    filter8 NVARCHAR(255),
    filter8_type NVARCHAR(100),
    filter9 NVARCHAR(255),
    filter9_type NVARCHAR(100),
    filter10 NVARCHAR(255),
    filter10_type NVARCHAR(100)
);
---------------------------------------

CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
--------------------------------------------------
CREATE TABLE UserActions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    action NVARCHAR(255) NOT NULL,
details VARCHAR(MAX)
    timestamp DATETIME NOT NULL
);
---------------------------------------------------

CREATE TABLE bin_master (
    bin_location_id INT IDENTITY(1,1) PRIMARY KEY,
    bin_location VARCHAR(225) NOT NULL, 
    bin_location_order INT NOT NULL, 
    bin_location_mandatory VARCHAR(10) CHECK (bin_location_mandatory IN ('Active', 'Inactive')),
    bin_capacity INT NOT NULL, 
    bin_zone_name VARCHAR(225), 
    bin_status VARCHAR(10) CHECK (bin_status IN ('Active', 'Inactive')),
    inactive_from_date DATE NULL,
    inactive_to_date DATE NULL,
    section VARCHAR(500) NOT NULL,
    sub_section VARCHAR(500) NOT NULL,
    bins VARCHAR(10) NOT NULL
);

--------------------------------------------------
INSERT INTO bin_master (section, sub_section, bins, bin_location, bin_location_order, bin_location_mandatory, bin_capacity, bin_zone_name, bin_status, inactive_from_date, inactive_to_date)
VALUES 
('A1', '1', 'B1', 'A1-1-B1', 6, 'Active', 0, 'Zone-6', 'Active', NULL, NULL),
('A1', '2', 'B2', 'A1-2-B2', 1, 'Active', 0, 'Zone-1', 'Active', NULL, NULL),
('A1', '2', 'B3', 'A1-2-B3', 2, 'Active', 0, 'Zone-2', 'Active', NULL, NULL),
('A1', '3', 'B4', 'A1-3-B4', 3, 'Active', 0, 'Zone-3', 'Active', NULL, NULL),
('A2', '1', 'B5', 'A2-1-B5', 4, 'Active', 0, 'Zone-4', 'Active', NULL, NULL), 
('A2', '2', 'B1', 'A2-2-B1', 5, 'Active', 0, 'Zone-5', 'Active', NULL, NULL),
('A2', '3', 'B2', 'A2-3-B2', 7, 'Active', 0, 'Zone-5', 'Active', NULL, NULL),
('A2', '4', 'B3', 'A2-4-B3', 8, 'Active', 0, 'Zone-5', 'Active', NULL, NULL),
('A3', '1', 'B1', 'A3-1-B1', 9, 'Active', 0, 'Zone-4', 'Active', NULL, NULL)
--------------------------------------------------------

-- Create Table: item_master
CREATE TABLE item_master (
    item_code VARCHAR(50) PRIMARY KEY,
    item_description VARCHAR(255) NOT NULL,
    item_category VARCHAR(100) NOT NULL,
    item_brand VARCHAR(100) NOT NULL,
    item_expiry_date_mandatory VARCHAR(3) CHECK (item_expiry_date_mandatory IN ('Yes', 'No')),
	make VARCHAR(MAX)
);

--------------------------------------------------------
INSERT INTO item_master (item_code, item_description, item_category, item_brand, item_expiry_date_mandatory, make)
VALUES 
('ITEM006', 'Tyre1', 'Tyre', 'MRF', 'Yes', 'make6'),
('ITEM001', 'DISC ', 'Brakes', 'SANS', 'Yes','make1'),
('ITEM002', 'oil1 ', 'engineoil', 'lubricant', 'No','make2'),
('ITEM003', 'Tyre1', 'Tyre', 'CAT', 'No','make3'),
('ITEM004', 'oil2', 'engineoil', 'Castrol', 'Yes','make4'),
('ITEM005', ' Tyre3', 'Tyre', 'Reebok', 'No','make5');

--------------------------------------------------------
truncate table order_master
truncate table order_master_status
truncate table order_master_log
truncate table issued_stock_table
truncate table receipt_master
truncate table receipt_master_log
truncate table allocation_table
truncate table transfer_table
truncate table holding_table
truncate table adjustment_table
truncate table reserve_table
--------------------------------------


INSERT INTO receipt_master (receipt_number,make, item_code, quantity, expiry_date, batch_number, supplier_name)
VALUES
('REC-001','make1', 'ITEM001', 80, '2025-01-01','B101','sup1'),
('REC-001','make2', 'ITEM002', 50, '2025-06-01','B102', 'sup1'),
('REC-002','make3', 'ITEM003', 100, '2025-12-01','B103', 'sup2'),
('REC-002','make4', 'ITEM004', 40, NULL,'B104', 'sup2'),
('REC-003','make5', 'ITEM005', 60, NULL,'B105', 'sup3'),
('REC-003','make6', 'ITEM006', 90, NULL,'B106', 'sup3'),
('REC-004','make7', 'ITEM007', 30, NULL,'B107', 'sup4'),
('REC-004','make8', 'ITEM008', 30, NULL,'B108', 'sup4')

INSERT INTO order_master (pickslip_number, pickslip_line_id, make,item_code, quantity, customer_name,customer_number,batch_number,invoice_number,reference)
VALUES
('PICKSLIP-001', 1,'make1','ITEM001', 40, 'c1','9515414743','B101','ADS51X546','ref1'),
('PICKSLIP-001',2,'make2', 'ITEM002', 10, 'c1','9515414743','B102','ADS51X546','ref2'),
('PICKSLIP-002', 1,'make3','ITEM003', 40, 'c2','123458975','B103','SZXDC652523','ref1'),
('PICKSLIP-002',2,'make4', 'ITEM004', 20, 'c2','123458975','B104','SZXDC652523','ref2'),
('PICKSLIP-003', 1,'make5','ITEM005', 50, 'c3','9515414743','B105','ASDC789625','ref1'),
('PICKSLIP-003',2,'make6', 'ITEM006', 30, 'c3','123458975','B106','ASDC789625','ref6'),
('PICKSLIP-004', 1,'make7','ITEM007', 50, 'c4','9515414743','B107','SDFESW78563','ref7'),
('PICKSLIP-004',2,'make8', 'ITEM008', 40, 'c4','123458975','B108','SDFESW78563','ref8')
