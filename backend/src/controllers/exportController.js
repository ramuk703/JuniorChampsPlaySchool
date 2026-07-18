const ExcelJS = require("exceljs");

const workbook = new ExcelJS.Workbook();

const sheet = workbook.addWorksheet("Teachers");

sheet.columns = [
  {
    header: "Employee ID",

    key: "employeeId",
  },

  {
    header: "Name",

    key: "name",
  },

  {
    header: "Qualification",

    key: "qualification",
  },
];
