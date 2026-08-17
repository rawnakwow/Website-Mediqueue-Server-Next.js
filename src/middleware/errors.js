function notFound(req,res){ res.status(404).json({ message:"API route not found" }); }
function errorHandler(err,req,res,next){ console.error(err); res.status(err.status || 500).json({ message: err.message || "Internal server error" }); }
module.exports = { notFound, errorHandler };
