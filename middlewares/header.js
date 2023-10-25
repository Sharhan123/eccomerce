


const clearheader = async function (req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Clear cache
  res.setHeader('Expires', '0'); // Clear cache
  res.setHeader('Pragma', 'no-cache'); // Clear cache
  // You can also clear other headers as needed
  next();
}

module.exports = {
  clearheader
}