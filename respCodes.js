const Codes = {
    ok: 200,
    created: 201,
    badRequest: 400,
    notFound: 404,
    alreadyExists: 409,
    internalErr: 500
};

const Messages = {
    ok: "OK",
    created: "Article created",
    badRequest: "Bad Request. Check your JSON input",
    notFound: "Not Found",
    alreadyExists: "Article with this title already exists",
    internalErr: "Internal Server Error"
};

exports.Codes = Codes;
exports.Messages = Messages;