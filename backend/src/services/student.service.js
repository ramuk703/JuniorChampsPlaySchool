const studentRepository = require("../repositories/student.repository");

exports.getStudents = async (query) => {
  return studentRepository.findAll(query);
};
