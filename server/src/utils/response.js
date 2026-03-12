const success = (res, data, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, data, message });

const error = (res, message = 'Something went wrong', status = 500, err = null) => {
  return res.status(status).json({ success: false, message, error: err?.message || null });
};

module.exports = { success, error };
