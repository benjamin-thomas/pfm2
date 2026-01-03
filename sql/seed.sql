INSERT INTO categories (name)
VALUES ('Equity')
     , ('Assets')
     , ('Income')
     , ('Expenses')
;

INSERT INTO accounts (category_id, name)
VALUES (1, 'OpeningBalance')    -- account_id =  1
     , (2, 'Checking account')  -- account_id =  2
     , (2, 'Savings account')   -- account_id =  3
     , (3, 'Unknown_INCOME')    -- account_id =  4
     , (3, 'Employer ABC')      -- account_id =  5
     , (4, 'Unknown_EXPENSE')   -- account_id =  6
     , (4, 'Groceries')         -- account_id =  7
     , (4, 'Communications')    -- account_id =  8
     , (4, 'Transport')         -- account_id =  9
     , (4, 'Health')            -- account_id = 10
     , (4, 'Energy')            -- account_id = 11
     , (4, 'Clothing')          -- account_id = 12
     , (4, 'Leisure')           -- account_id = 13
     ;