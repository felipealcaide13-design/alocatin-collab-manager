-- Renomeia os valores do enum senioridade_enum de "Staf I/II" para "Staff I/II"
ALTER TYPE senioridade_enum RENAME VALUE 'Staf I' TO 'Staff I';
ALTER TYPE senioridade_enum RENAME VALUE 'Staf II' TO 'Staff II';
