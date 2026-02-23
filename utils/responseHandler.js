// ==========================================
// FICHIER: utils/responseHandler.js
// ==========================================
class ResponseHandler {
  static success(res, message, data = null, statusCode = 200) {
    const response = {
      success: true,
      message
    };
    
    if (data !== null) {
      response.data = data;
    }
    
    return res.status(statusCode).json(response);
  }

  static error(res, message, statusCode = 400, errors = null) {
    const response = {
      success: false,
      message
    };
    
    if (errors !== null) {
      response.errors = errors;
    }
    
    return res.status(statusCode).json(response);
  }

  static validationError(res, errors) {
    return res.status(422).json({
      success: false,
      message: 'Erreur de validation',
      errors
    });
  }
}

module.exports = ResponseHandler;