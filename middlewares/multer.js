const multer = require("multer");

const storage = multer.diskStorage({
    destination: "public/uploads/",
    filename: (req, file, cb) => {
      const filename = file.originalname;
      cb(null, filename); // Use the unique file name
    }
})

const upload = multer({ storage: storage });

module.exports = {upload};