var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/serverless-http/lib/finish.js
var require_finish = __commonJS({
  "node_modules/serverless-http/lib/finish.js"(exports2, module2) {
    "use strict";
    module2.exports = async function finish(item, transform, ...details) {
      await new Promise((resolve, reject) => {
        if (item.finished || item.complete) {
          resolve();
          return;
        }
        let finished = false;
        function done(err) {
          if (finished) {
            return;
          }
          finished = true;
          item.removeListener("error", done);
          item.removeListener("end", done);
          item.removeListener("finish", done);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
        item.once("error", done);
        item.once("end", done);
        item.once("finish", done);
      });
      if (typeof transform === "function") {
        await transform(item, ...details);
      } else if (typeof transform === "object" && transform !== null) {
        Object.assign(item, transform);
      }
      return item;
    };
  }
});

// node_modules/serverless-http/lib/response.js
var require_response = __commonJS({
  "node_modules/serverless-http/lib/response.js"(exports2, module2) {
    "use strict";
    var http = require("http");
    var headerEnd = "\r\n\r\n";
    var BODY = Symbol();
    var HEADERS = Symbol();
    function getString(data) {
      if (Buffer.isBuffer(data)) {
        return data.toString("utf8");
      } else if (typeof data === "string") {
        return data;
      } else {
        throw new Error(`response.write() of unexpected type: ${typeof data}`);
      }
    }
    function addData(stream, data) {
      if (Buffer.isBuffer(data) || typeof data === "string" || data instanceof Uint8Array) {
        stream[BODY].push(Buffer.from(data));
      } else {
        throw new Error(`response.write() of unexpected type: ${typeof data}`);
      }
    }
    module2.exports = class ServerlessResponse extends http.ServerResponse {
      static from(res) {
        const response = new ServerlessResponse(res);
        response.statusCode = res.statusCode;
        response[HEADERS] = res.headers;
        response[BODY] = [Buffer.from(res.body)];
        response.end();
        return response;
      }
      static body(res) {
        return Buffer.concat(res[BODY]);
      }
      static headers(res) {
        const headers = typeof res.getHeaders === "function" ? res.getHeaders() : res._headers;
        return Object.assign(headers, res[HEADERS]);
      }
      get headers() {
        return this[HEADERS];
      }
      setHeader(key, value) {
        if (this._wroteHeader) {
          this[HEADERS][key] = value;
        } else {
          super.setHeader(key, value);
        }
      }
      writeHead(statusCode, reason, obj) {
        const headers = typeof reason === "string" ? obj : reason;
        for (const name in headers) {
          this.setHeader(name, headers[name]);
          if (!this._wroteHeader) {
            break;
          }
        }
        super.writeHead(statusCode, reason, obj);
      }
      constructor({ method }) {
        super({ method });
        this[BODY] = [];
        this[HEADERS] = {};
        this.useChunkedEncodingByDefault = false;
        this.chunkedEncoding = false;
        this._header = "";
        this.assignSocket({
          _writableState: {},
          writable: true,
          on: Function.prototype,
          removeListener: Function.prototype,
          destroy: Function.prototype,
          cork: Function.prototype,
          uncork: Function.prototype,
          write: (data, encoding, cb) => {
            if (typeof encoding === "function") {
              cb = encoding;
              encoding = null;
            }
            if (this._header === "" || this._wroteHeader) {
              addData(this, data);
            } else {
              const string = getString(data);
              const index = string.indexOf(headerEnd);
              if (index !== -1) {
                const remainder = string.slice(index + headerEnd.length);
                if (remainder) {
                  addData(this, remainder);
                }
                this._wroteHeader = true;
              }
            }
            if (typeof cb === "function") {
              cb();
            }
          }
        });
        this.once("finish", () => {
          this.emit("close");
        });
      }
    };
  }
});

// node_modules/serverless-http/lib/framework/get-framework.js
var require_get_framework = __commonJS({
  "node_modules/serverless-http/lib/framework/get-framework.js"(exports2, module2) {
    "use strict";
    var http = require("http");
    var Response = require_response();
    function common(cb) {
      return (request) => {
        const response = new Response(request);
        cb(request, response);
        return response;
      };
    }
    module2.exports = function getFramework(app) {
      if (app instanceof http.Server) {
        return (request) => {
          const response = new Response(request);
          app.emit("request", request, response);
          return response;
        };
      }
      if (typeof app.callback === "function") {
        return common(app.callback());
      }
      if (typeof app.handle === "function") {
        return common((request, response) => {
          app.handle(request, response);
        });
      }
      if (typeof app.handler === "function") {
        return common((request, response) => {
          app.handler(request, response);
        });
      }
      if (typeof app._onRequest === "function") {
        return common((request, response) => {
          app._onRequest(request, response);
        });
      }
      if (typeof app === "function") {
        return common(app);
      }
      if (app.router && typeof app.router.route == "function") {
        return common((req, res) => {
          const { url, method, headers, body } = req;
          app.router.route({ url, method, headers, body }, res);
        });
      }
      if (app._core && typeof app._core._dispatch === "function") {
        return common(app._core._dispatch({
          app
        }));
      }
      if (typeof app.inject === "function") {
        return async (request) => {
          const { method, url, headers, body } = request;
          const res = await app.inject({ method, url, headers, payload: body });
          return Response.from(res);
        };
      }
      if (typeof app.main === "function") {
        return common(app.main);
      }
      throw new Error("Unsupported framework");
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/clean-up-event.js
var require_clean_up_event = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/clean-up-event.js"(exports2, module2) {
    "use strict";
    function removeBasePath(path = "/", basePath) {
      if (basePath) {
        const basePathIndex = path.indexOf(basePath);
        if (basePathIndex > -1) {
          return path.substr(basePathIndex + basePath.length) || "/";
        }
      }
      return path;
    }
    function isString(value) {
      return typeof value === "string" || value instanceof String;
    }
    function specialDecodeURIComponent(value) {
      if (!isString(value)) {
        return value;
      }
      let decoded;
      try {
        decoded = decodeURIComponent(value.replace(/[+]/g, "%20"));
      } catch (err) {
        decoded = value.replace(/[+]/g, "%20");
      }
      return decoded;
    }
    function recursiveURLDecode(value) {
      if (isString(value)) {
        return specialDecodeURIComponent(value);
      } else if (Array.isArray(value)) {
        const decodedArray = [];
        for (let index in value) {
          decodedArray.push(recursiveURLDecode(value[index]));
        }
        return decodedArray;
      } else if (value instanceof Object) {
        const decodedObject = {};
        for (let key of Object.keys(value)) {
          decodedObject[specialDecodeURIComponent(key)] = recursiveURLDecode(value[key]);
        }
        return decodedObject;
      }
      return value;
    }
    module2.exports = function cleanupEvent(evt, options) {
      const event = evt || {};
      event.requestContext = event.requestContext || {};
      event.body = event.body || "";
      event.headers = event.headers || {};
      if ("elb" in event.requestContext) {
        if (event.multiValueQueryStringParameters) {
          event.multiValueQueryStringParameters = recursiveURLDecode(event.multiValueQueryStringParameters);
        }
        if (event.queryStringParameters) {
          event.queryStringParameters = recursiveURLDecode(event.queryStringParameters);
        }
      }
      if (event.version === "2.0") {
        event.requestContext.authorizer = event.requestContext.authorizer || {};
        event.requestContext.http.method = event.requestContext.http.method || "GET";
        event.rawPath = removeBasePath(event.requestPath || event.rawPath, options.basePath);
      } else {
        event.requestContext.identity = event.requestContext.identity || {};
        event.httpMethod = event.httpMethod || "GET";
        event.path = removeBasePath(event.requestPath || event.path, options.basePath);
      }
      return event;
    };
  }
});

// node_modules/serverless-http/lib/request.js
var require_request = __commonJS({
  "node_modules/serverless-http/lib/request.js"(exports2, module2) {
    "use strict";
    var http = require("http");
    module2.exports = class ServerlessRequest extends http.IncomingMessage {
      constructor({ method, url, headers, body, remoteAddress }) {
        super({
          encrypted: true,
          readable: false,
          remoteAddress,
          address: () => ({ port: 443 }),
          end: Function.prototype,
          destroy: Function.prototype
        });
        if (typeof headers["content-length"] === "undefined") {
          headers["content-length"] = Buffer.byteLength(body);
        }
        Object.assign(this, {
          ip: remoteAddress,
          complete: true,
          httpVersion: "1.1",
          httpVersionMajor: "1",
          httpVersionMinor: "1",
          method,
          headers,
          body,
          url
        });
        this._read = () => {
          this.push(body);
          this.push(null);
        };
      }
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/create-request.js
var require_create_request = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/create-request.js"(exports2, module2) {
    "use strict";
    var URL2 = require("url");
    var Request = require_request();
    function requestMethod(event) {
      if (event.version === "2.0") {
        return event.requestContext.http.method;
      }
      return event.httpMethod;
    }
    function requestRemoteAddress(event) {
      if (event.version === "2.0") {
        return event.requestContext.http.sourceIp;
      }
      return event.requestContext.identity.sourceIp;
    }
    function requestHeaders(event) {
      const initialHeader = event.version === "2.0" && Array.isArray(event.cookies) ? { cookie: event.cookies.join("; ") } : {};
      if (event.multiValueHeaders) {
        Object.keys(event.multiValueHeaders).reduce((headers, key) => {
          headers[key.toLowerCase()] = event.multiValueHeaders[key].join(", ");
          return headers;
        }, initialHeader);
      }
      return Object.keys(event.headers).reduce((headers, key) => {
        headers[key.toLowerCase()] = event.headers[key];
        return headers;
      }, initialHeader);
    }
    function requestBody(event) {
      const type = typeof event.body;
      if (Buffer.isBuffer(event.body)) {
        return event.body;
      } else if (type === "string") {
        return Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
      } else if (type === "object") {
        return Buffer.from(JSON.stringify(event.body));
      }
      throw new Error(`Unexpected event.body type: ${typeof event.body}`);
    }
    function requestUrl(event) {
      if (event.version === "2.0") {
        return URL2.format({
          pathname: event.rawPath,
          search: event.rawQueryString
        });
      }
      const query = event.multiValueQueryStringParameters || {};
      if (event.queryStringParameters) {
        Object.keys(event.queryStringParameters).forEach((key) => {
          if (Array.isArray(query[key])) {
            if (!query[key].includes(event.queryStringParameters[key])) {
              query[key].push(event.queryStringParameters[key]);
            }
          } else {
            query[key] = [event.queryStringParameters[key]];
          }
        });
      }
      return URL2.format({
        pathname: event.path,
        query
      });
    }
    module2.exports = (event, context, options) => {
      const method = requestMethod(event);
      const remoteAddress = requestRemoteAddress(event);
      const headers = requestHeaders(event);
      const body = requestBody(event);
      const url = requestUrl(event);
      if (typeof options.requestId === "string" && options.requestId.length > 0) {
        const header = options.requestId.toLowerCase();
        const requestId = headers[header] || event.requestContext.requestId;
        if (requestId) {
          headers[header] = requestId;
        }
      }
      const req = new Request({
        method,
        headers,
        body,
        remoteAddress,
        url
      });
      req.requestContext = event.requestContext;
      req.apiGateway = {
        event,
        context
      };
      return req;
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/is-binary.js
var require_is_binary = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/is-binary.js"(exports2, module2) {
    "use strict";
    var BINARY_ENCODINGS = ["gzip", "deflate", "br"];
    var BINARY_CONTENT_TYPES = (process.env.BINARY_CONTENT_TYPES || "").split(",");
    function isBinaryEncoding(headers) {
      const contentEncoding = headers["content-encoding"];
      if (typeof contentEncoding === "string") {
        return contentEncoding.split(",").some(
          (value) => BINARY_ENCODINGS.some((binaryEncoding) => value.indexOf(binaryEncoding) !== -1)
        );
      }
    }
    function isBinaryContent(headers, options) {
      const contentTypes = [].concat(
        options.binary ? options.binary : BINARY_CONTENT_TYPES
      ).map(
        (candidate) => new RegExp(`^${candidate.replace(/\*/g, ".*")}$`)
      );
      const contentType = (headers["content-type"] || "").split(";")[0];
      return !!contentType && contentTypes.some((candidate) => candidate.test(contentType));
    }
    module2.exports = function isBinary(headers, options) {
      if (options.binary === false) {
        return false;
      }
      if (options.binary === true) {
        return true;
      }
      if (typeof options.binary === "function") {
        return options.binary(headers);
      }
      return isBinaryEncoding(headers) || isBinaryContent(headers, options);
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/sanitize-headers.js
var require_sanitize_headers = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/sanitize-headers.js"(exports2, module2) {
    "use strict";
    module2.exports = function sanitizeHeaders(headers) {
      return Object.keys(headers).reduce((memo, key) => {
        const value = headers[key];
        if (Array.isArray(value)) {
          memo.multiValueHeaders[key] = value;
          if (key.toLowerCase() !== "set-cookie") {
            memo.headers[key] = value.join(", ");
          }
        } else {
          memo.headers[key] = value == null ? "" : value.toString();
        }
        return memo;
      }, {
        headers: {},
        multiValueHeaders: {}
      });
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/format-response.js
var require_format_response = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/format-response.js"(exports2, module2) {
    "use strict";
    var isBinary = require_is_binary();
    var Response = require_response();
    var sanitizeHeaders = require_sanitize_headers();
    module2.exports = (event, response, options) => {
      const { statusCode } = response;
      const { headers, multiValueHeaders } = sanitizeHeaders(Response.headers(response));
      let cookies = [];
      if (multiValueHeaders["set-cookie"]) {
        cookies = multiValueHeaders["set-cookie"];
      }
      const isBase64Encoded = isBinary(headers, options);
      const encoding = isBase64Encoded ? "base64" : "utf8";
      let body = Response.body(response).toString(encoding);
      if (headers["transfer-encoding"] === "chunked" || response.chunkedEncoding) {
        const raw = Response.body(response).toString().split("\r\n");
        const parsed = [];
        for (let i = 0; i < raw.length; i += 2) {
          const size = parseInt(raw[i], 16);
          const value = raw[i + 1];
          if (value) {
            parsed.push(value.substring(0, size));
          }
        }
        body = parsed.join("");
      }
      let formattedResponse = { statusCode, headers, isBase64Encoded, body };
      if (event.version === "2.0" && cookies.length) {
        formattedResponse["cookies"] = cookies;
      }
      if ((!event.version || event.version === "1.0") && Object.keys(multiValueHeaders).length) {
        formattedResponse["multiValueHeaders"] = multiValueHeaders;
      }
      return formattedResponse;
    };
  }
});

// node_modules/serverless-http/lib/provider/aws/index.js
var require_aws = __commonJS({
  "node_modules/serverless-http/lib/provider/aws/index.js"(exports2, module2) {
    var cleanUpEvent = require_clean_up_event();
    var createRequest = require_create_request();
    var formatResponse = require_format_response();
    module2.exports = (options) => {
      return (getResponse) => async (event_, context = {}) => {
        const event = cleanUpEvent(event_, options);
        const request = createRequest(event, context, options);
        const response = await getResponse(request, event, context);
        return formatResponse(event, response, options);
      };
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/clean-up-request.js
var require_clean_up_request = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/clean-up-request.js"(exports2, module2) {
    "use strict";
    function getUrl({ requestPath, url }) {
      if (requestPath) {
        return requestPath;
      }
      return typeof url === "string" ? url : "/";
    }
    function getRequestContext(request) {
      const requestContext = {};
      requestContext.identity = {};
      const forwardedIp = request.headers["x-forwarded-for"];
      const clientIp = request.headers["client-ip"];
      const ip = forwardedIp ? forwardedIp : clientIp ? clientIp : "";
      if (ip) {
        requestContext.identity.sourceIp = ip.split(":")[0];
      }
      return requestContext;
    }
    module2.exports = function cleanupRequest(req, options) {
      const request = req || {};
      request.requestContext = getRequestContext(req);
      request.method = request.method || "GET";
      request.url = getUrl(request);
      request.body = request.body || "";
      request.headers = request.headers || {};
      if (options.basePath) {
        const basePathIndex = request.url.indexOf(options.basePath);
        if (basePathIndex > -1) {
          request.url = request.url.substr(basePathIndex + options.basePath.length);
        }
      }
      return request;
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/create-request.js
var require_create_request2 = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/create-request.js"(exports2, module2) {
    "use strict";
    var url = require("url");
    var Request = require_request();
    function requestHeaders(request) {
      return Object.keys(request.headers).reduce((headers, key) => {
        headers[key.toLowerCase()] = request.headers[key];
        return headers;
      }, {});
    }
    function requestBody(request) {
      const type = typeof request.rawBody;
      if (Buffer.isBuffer(request.rawBody)) {
        return request.rawBody;
      } else if (type === "string") {
        return Buffer.from(request.rawBody, "utf8");
      } else if (type === "object") {
        return Buffer.from(JSON.stringify(request.rawBody));
      }
      throw new Error(`Unexpected request.body type: ${typeof request.rawBody}`);
    }
    module2.exports = (request) => {
      const method = request.method;
      const query = request.query;
      const headers = requestHeaders(request);
      const body = requestBody(request);
      const req = new Request({
        method,
        headers,
        body,
        url: url.format({
          pathname: request.url,
          query
        })
      });
      req.requestContext = request.requestContext;
      return req;
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/is-binary.js
var require_is_binary2 = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/is-binary.js"(exports2, module2) {
    "use strict";
    var BINARY_ENCODINGS = ["gzip", "deflate", "br"];
    var BINARY_CONTENT_TYPES = (process.env.BINARY_CONTENT_TYPES || "").split(",");
    function isBinaryEncoding(headers) {
      const contentEncoding = headers["content-encoding"];
      if (typeof contentEncoding === "string") {
        return contentEncoding.split(",").some(
          (value) => BINARY_ENCODINGS.some((binaryEncoding) => value.indexOf(binaryEncoding) !== -1)
        );
      }
    }
    function isBinaryContent(headers, options) {
      const contentTypes = [].concat(
        options.binary ? options.binary : BINARY_CONTENT_TYPES
      ).map(
        (candidate) => new RegExp(`^${candidate.replace(/\*/g, ".*")}$`)
      );
      const contentType = (headers["content-type"] || "").split(";")[0];
      return !!contentType && contentTypes.some((candidate) => candidate.test(contentType));
    }
    module2.exports = function isBinary(headers, options) {
      if (options.binary === false) {
        return false;
      }
      if (options.binary === true) {
        return true;
      }
      if (typeof options.binary === "function") {
        return options.binary(headers);
      }
      return isBinaryEncoding(headers) || isBinaryContent(headers, options);
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/set-cookie.json
var require_set_cookie = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/set-cookie.json"(exports2, module2) {
    module2.exports = { variations: ["set-cookie", "Set-cookie", "sEt-cookie", "SEt-cookie", "seT-cookie", "SeT-cookie", "sET-cookie", "SET-cookie", "set-Cookie", "Set-Cookie", "sEt-Cookie", "SEt-Cookie", "seT-Cookie", "SeT-Cookie", "sET-Cookie", "SET-Cookie", "set-cOokie", "Set-cOokie", "sEt-cOokie", "SEt-cOokie", "seT-cOokie", "SeT-cOokie", "sET-cOokie", "SET-cOokie", "set-COokie", "Set-COokie", "sEt-COokie", "SEt-COokie", "seT-COokie", "SeT-COokie", "sET-COokie", "SET-COokie", "set-coOkie", "Set-coOkie", "sEt-coOkie", "SEt-coOkie", "seT-coOkie", "SeT-coOkie", "sET-coOkie", "SET-coOkie", "set-CoOkie", "Set-CoOkie", "sEt-CoOkie", "SEt-CoOkie", "seT-CoOkie", "SeT-CoOkie", "sET-CoOkie", "SET-CoOkie", "set-cOOkie", "Set-cOOkie", "sEt-cOOkie", "SEt-cOOkie", "seT-cOOkie", "SeT-cOOkie", "sET-cOOkie", "SET-cOOkie", "set-COOkie", "Set-COOkie", "sEt-COOkie", "SEt-COOkie", "seT-COOkie", "SeT-COOkie", "sET-COOkie", "SET-COOkie", "set-cooKie", "Set-cooKie", "sEt-cooKie", "SEt-cooKie", "seT-cooKie", "SeT-cooKie", "sET-cooKie", "SET-cooKie", "set-CooKie", "Set-CooKie", "sEt-CooKie", "SEt-CooKie", "seT-CooKie", "SeT-CooKie", "sET-CooKie", "SET-CooKie", "set-cOoKie", "Set-cOoKie", "sEt-cOoKie", "SEt-cOoKie", "seT-cOoKie", "SeT-cOoKie", "sET-cOoKie", "SET-cOoKie", "set-COoKie", "Set-COoKie", "sEt-COoKie", "SEt-COoKie", "seT-COoKie", "SeT-COoKie", "sET-COoKie", "SET-COoKie", "set-coOKie", "Set-coOKie", "sEt-coOKie", "SEt-coOKie", "seT-coOKie", "SeT-coOKie", "sET-coOKie", "SET-coOKie", "set-CoOKie", "Set-CoOKie", "sEt-CoOKie", "SEt-CoOKie", "seT-CoOKie", "SeT-CoOKie", "sET-CoOKie", "SET-CoOKie", "set-cOOKie", "Set-cOOKie", "sEt-cOOKie", "SEt-cOOKie", "seT-cOOKie", "SeT-cOOKie", "sET-cOOKie", "SET-cOOKie", "set-COOKie", "Set-COOKie", "sEt-COOKie", "SEt-COOKie", "seT-COOKie", "SeT-COOKie", "sET-COOKie", "SET-COOKie", "set-cookIe", "Set-cookIe", "sEt-cookIe", "SEt-cookIe", "seT-cookIe", "SeT-cookIe", "sET-cookIe", "SET-cookIe", "set-CookIe", "Set-CookIe", "sEt-CookIe", "SEt-CookIe", "seT-CookIe", "SeT-CookIe", "sET-CookIe", "SET-CookIe", "set-cOokIe", "Set-cOokIe", "sEt-cOokIe", "SEt-cOokIe", "seT-cOokIe", "SeT-cOokIe", "sET-cOokIe", "SET-cOokIe", "set-COokIe", "Set-COokIe", "sEt-COokIe", "SEt-COokIe", "seT-COokIe", "SeT-COokIe", "sET-COokIe", "SET-COokIe", "set-coOkIe", "Set-coOkIe", "sEt-coOkIe", "SEt-coOkIe", "seT-coOkIe", "SeT-coOkIe", "sET-coOkIe", "SET-coOkIe", "set-CoOkIe", "Set-CoOkIe", "sEt-CoOkIe", "SEt-CoOkIe", "seT-CoOkIe", "SeT-CoOkIe", "sET-CoOkIe", "SET-CoOkIe", "set-cOOkIe", "Set-cOOkIe", "sEt-cOOkIe", "SEt-cOOkIe", "seT-cOOkIe", "SeT-cOOkIe", "sET-cOOkIe", "SET-cOOkIe", "set-COOkIe", "Set-COOkIe", "sEt-COOkIe", "SEt-COOkIe", "seT-COOkIe", "SeT-COOkIe", "sET-COOkIe", "SET-COOkIe", "set-cooKIe", "Set-cooKIe", "sEt-cooKIe", "SEt-cooKIe", "seT-cooKIe", "SeT-cooKIe", "sET-cooKIe", "SET-cooKIe", "set-CooKIe", "Set-CooKIe", "sEt-CooKIe", "SEt-CooKIe", "seT-CooKIe", "SeT-CooKIe", "sET-CooKIe", "SET-CooKIe", "set-cOoKIe", "Set-cOoKIe", "sEt-cOoKIe", "SEt-cOoKIe", "seT-cOoKIe", "SeT-cOoKIe", "sET-cOoKIe", "SET-cOoKIe", "set-COoKIe", "Set-COoKIe", "sEt-COoKIe", "SEt-COoKIe", "seT-COoKIe", "SeT-COoKIe", "sET-COoKIe", "SET-COoKIe", "set-coOKIe", "Set-coOKIe", "sEt-coOKIe", "SEt-coOKIe", "seT-coOKIe", "SeT-coOKIe", "sET-coOKIe", "SET-coOKIe", "set-CoOKIe", "Set-CoOKIe", "sEt-CoOKIe", "SEt-CoOKIe", "seT-CoOKIe", "SeT-CoOKIe", "sET-CoOKIe", "SET-CoOKIe", "set-cOOKIe", "Set-cOOKIe", "sEt-cOOKIe", "SEt-cOOKIe", "seT-cOOKIe", "SeT-cOOKIe", "sET-cOOKIe", "SET-cOOKIe", "set-COOKIe", "Set-COOKIe", "sEt-COOKIe", "SEt-COOKIe", "seT-COOKIe", "SeT-COOKIe", "sET-COOKIe", "SET-COOKIe", "set-cookiE", "Set-cookiE", "sEt-cookiE", "SEt-cookiE", "seT-cookiE", "SeT-cookiE", "sET-cookiE", "SET-cookiE", "set-CookiE", "Set-CookiE", "sEt-CookiE", "SEt-CookiE", "seT-CookiE", "SeT-CookiE", "sET-CookiE", "SET-CookiE", "set-cOokiE", "Set-cOokiE", "sEt-cOokiE", "SEt-cOokiE", "seT-cOokiE", "SeT-cOokiE", "sET-cOokiE", "SET-cOokiE", "set-COokiE", "Set-COokiE", "sEt-COokiE", "SEt-COokiE", "seT-COokiE", "SeT-COokiE", "sET-COokiE", "SET-COokiE", "set-coOkiE", "Set-coOkiE", "sEt-coOkiE", "SEt-coOkiE", "seT-coOkiE", "SeT-coOkiE", "sET-coOkiE", "SET-coOkiE", "set-CoOkiE", "Set-CoOkiE", "sEt-CoOkiE", "SEt-CoOkiE", "seT-CoOkiE", "SeT-CoOkiE", "sET-CoOkiE", "SET-CoOkiE", "set-cOOkiE", "Set-cOOkiE", "sEt-cOOkiE", "SEt-cOOkiE", "seT-cOOkiE", "SeT-cOOkiE", "sET-cOOkiE", "SET-cOOkiE", "set-COOkiE", "Set-COOkiE", "sEt-COOkiE", "SEt-COOkiE", "seT-COOkiE", "SeT-COOkiE", "sET-COOkiE", "SET-COOkiE", "set-cooKiE", "Set-cooKiE", "sEt-cooKiE", "SEt-cooKiE", "seT-cooKiE", "SeT-cooKiE", "sET-cooKiE", "SET-cooKiE", "set-CooKiE", "Set-CooKiE", "sEt-CooKiE", "SEt-CooKiE", "seT-CooKiE", "SeT-CooKiE", "sET-CooKiE", "SET-CooKiE", "set-cOoKiE", "Set-cOoKiE", "sEt-cOoKiE", "SEt-cOoKiE", "seT-cOoKiE", "SeT-cOoKiE", "sET-cOoKiE", "SET-cOoKiE", "set-COoKiE", "Set-COoKiE", "sEt-COoKiE", "SEt-COoKiE", "seT-COoKiE", "SeT-COoKiE", "sET-COoKiE", "SET-COoKiE", "set-coOKiE", "Set-coOKiE", "sEt-coOKiE", "SEt-coOKiE", "seT-coOKiE", "SeT-coOKiE", "sET-coOKiE", "SET-coOKiE", "set-CoOKiE", "Set-CoOKiE", "sEt-CoOKiE", "SEt-CoOKiE", "seT-CoOKiE", "SeT-CoOKiE", "sET-CoOKiE", "SET-CoOKiE", "set-cOOKiE", "Set-cOOKiE", "sEt-cOOKiE", "SEt-cOOKiE", "seT-cOOKiE", "SeT-cOOKiE", "sET-cOOKiE", "SET-cOOKiE", "set-COOKiE", "Set-COOKiE", "sEt-COOKiE", "SEt-COOKiE", "seT-COOKiE", "SeT-COOKiE", "sET-COOKiE", "SET-COOKiE", "set-cookIE", "Set-cookIE", "sEt-cookIE", "SEt-cookIE", "seT-cookIE", "SeT-cookIE", "sET-cookIE", "SET-cookIE", "set-CookIE", "Set-CookIE", "sEt-CookIE", "SEt-CookIE", "seT-CookIE", "SeT-CookIE", "sET-CookIE", "SET-CookIE", "set-cOokIE", "Set-cOokIE", "sEt-cOokIE", "SEt-cOokIE", "seT-cOokIE", "SeT-cOokIE", "sET-cOokIE", "SET-cOokIE", "set-COokIE", "Set-COokIE", "sEt-COokIE", "SEt-COokIE", "seT-COokIE", "SeT-COokIE", "sET-COokIE", "SET-COokIE", "set-coOkIE", "Set-coOkIE", "sEt-coOkIE", "SEt-coOkIE", "seT-coOkIE", "SeT-coOkIE", "sET-coOkIE", "SET-coOkIE", "set-CoOkIE", "Set-CoOkIE", "sEt-CoOkIE", "SEt-CoOkIE", "seT-CoOkIE", "SeT-CoOkIE", "sET-CoOkIE", "SET-CoOkIE", "set-cOOkIE", "Set-cOOkIE", "sEt-cOOkIE", "SEt-cOOkIE", "seT-cOOkIE", "SeT-cOOkIE", "sET-cOOkIE", "SET-cOOkIE", "set-COOkIE", "Set-COOkIE", "sEt-COOkIE", "SEt-COOkIE", "seT-COOkIE", "SeT-COOkIE", "sET-COOkIE", "SET-COOkIE", "set-cooKIE", "Set-cooKIE", "sEt-cooKIE", "SEt-cooKIE", "seT-cooKIE", "SeT-cooKIE", "sET-cooKIE", "SET-cooKIE", "set-CooKIE", "Set-CooKIE", "sEt-CooKIE", "SEt-CooKIE", "seT-CooKIE", "SeT-CooKIE", "sET-CooKIE", "SET-CooKIE", "set-cOoKIE", "Set-cOoKIE", "sEt-cOoKIE", "SEt-cOoKIE", "seT-cOoKIE", "SeT-cOoKIE", "sET-cOoKIE", "SET-cOoKIE", "set-COoKIE", "Set-COoKIE", "sEt-COoKIE", "SEt-COoKIE", "seT-COoKIE", "SeT-COoKIE", "sET-COoKIE", "SET-COoKIE", "set-coOKIE", "Set-coOKIE", "sEt-coOKIE", "SEt-coOKIE", "seT-coOKIE", "SeT-coOKIE", "sET-coOKIE", "SET-coOKIE", "set-CoOKIE", "Set-CoOKIE", "sEt-CoOKIE", "SEt-CoOKIE", "seT-CoOKIE", "SeT-CoOKIE", "sET-CoOKIE", "SET-CoOKIE", "set-cOOKIE", "Set-cOOKIE", "sEt-cOOKIE", "SEt-cOOKIE", "seT-cOOKIE", "SeT-cOOKIE", "sET-cOOKIE", "SET-cOOKIE", "set-COOKIE", "Set-COOKIE", "sEt-COOKIE", "SEt-COOKIE", "seT-COOKIE", "SeT-COOKIE", "sET-COOKIE", "SET-COOKIE"] };
  }
});

// node_modules/serverless-http/lib/provider/azure/sanitize-headers.js
var require_sanitize_headers2 = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/sanitize-headers.js"(exports2, module2) {
    "use strict";
    var setCookieVariations = require_set_cookie().variations;
    module2.exports = function sanitizeHeaders(headers) {
      return Object.keys(headers).reduce((memo, key) => {
        const value = headers[key];
        if (Array.isArray(value)) {
          if (key.toLowerCase() === "set-cookie") {
            value.forEach((cookie, i) => {
              memo[setCookieVariations[i]] = cookie;
            });
          } else {
            memo[key] = value.join(", ");
          }
        } else {
          memo[key] = value == null ? "" : value.toString();
        }
        return memo;
      }, {});
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/format-response.js
var require_format_response2 = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/format-response.js"(exports2, module2) {
    var isBinary = require_is_binary2();
    var Response = require_response();
    var sanitizeHeaders = require_sanitize_headers2();
    module2.exports = (response, options) => {
      const { statusCode } = response;
      const headers = sanitizeHeaders(Response.headers(response));
      if (headers["transfer-encoding"] === "chunked" || response.chunkedEncoding) {
        throw new Error("chunked encoding not supported");
      }
      const isBase64Encoded = isBinary(headers, options);
      const encoding = isBase64Encoded ? "base64" : "utf8";
      const body = Response.body(response).toString(encoding);
      return { status: statusCode, headers, isBase64Encoded, body };
    };
  }
});

// node_modules/serverless-http/lib/provider/azure/index.js
var require_azure = __commonJS({
  "node_modules/serverless-http/lib/provider/azure/index.js"(exports2, module2) {
    var cleanupRequest = require_clean_up_request();
    var createRequest = require_create_request2();
    var formatResponse = require_format_response2();
    module2.exports = (options) => {
      return (getResponse) => async (context, req) => {
        const event = cleanupRequest(req, options);
        const request = createRequest(event, options);
        const response = await getResponse(request, context, event);
        context.log(response);
        return formatResponse(response, options);
      };
    };
  }
});

// node_modules/serverless-http/lib/provider/get-provider.js
var require_get_provider = __commonJS({
  "node_modules/serverless-http/lib/provider/get-provider.js"(exports2, module2) {
    var aws = require_aws();
    var azure = require_azure();
    var providers = {
      aws,
      azure
    };
    module2.exports = function getProvider(options) {
      const { provider = "aws" } = options;
      if (provider in providers) {
        return providers[provider](options);
      }
      throw new Error(`Unsupported provider ${provider}`);
    };
  }
});

// node_modules/serverless-http/serverless-http.js
var require_serverless_http = __commonJS({
  "node_modules/serverless-http/serverless-http.js"(exports2, module2) {
    "use strict";
    var finish = require_finish();
    var getFramework = require_get_framework();
    var getProvider = require_get_provider();
    var defaultOptions = {
      requestId: "x-request-id"
    };
    module2.exports = function(app, opts) {
      const options = Object.assign({}, defaultOptions, opts);
      const framework = getFramework(app);
      const provider = getProvider(options);
      return provider(async (request, ...context) => {
        await finish(request, options.request, ...context);
        const response = await framework(request);
        await finish(response, options.response, ...context);
        return response;
      });
    };
  }
});

// node_modules/dotenv/package.json
var require_package = __commonJS({
  "node_modules/dotenv/package.json"(exports2, module2) {
    module2.exports = {
      name: "dotenv",
      version: "16.4.7",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        pretest: "npm run lint && npm run dts-check",
        test: "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
        "test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@types/node": "^18.11.3",
        decache: "^4.6.2",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-version": "^9.5.0",
        tap: "^19.2.0",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    var crypto = require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      const vaultPath = _vaultPath(options);
      const result = DotenvModule.configDotenv({ path: vaultPath });
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _log(message) {
      console.log(`[dotenv@${version}][INFO] ${message}`);
    }
    function _warn(message) {
      console.log(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      _log("Loading env from encrypted .env.vault");
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      const debug = Boolean(options && options.debug);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsedAll, options);
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
        }
      }
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// node_modules/object-assign/index.js
var require_object_assign = __commonJS({
  "node_modules/object-assign/index.js"(exports2, module2) {
    "use strict";
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;
    function toObject(val) {
      if (val === null || val === void 0) {
        throw new TypeError("Object.assign cannot be called with null or undefined");
      }
      return Object(val);
    }
    function shouldUseNative() {
      try {
        if (!Object.assign) {
          return false;
        }
        var test1 = new String("abc");
        test1[5] = "de";
        if (Object.getOwnPropertyNames(test1)[0] === "5") {
          return false;
        }
        var test2 = {};
        for (var i = 0; i < 10; i++) {
          test2["_" + String.fromCharCode(i)] = i;
        }
        var order2 = Object.getOwnPropertyNames(test2).map(function(n) {
          return test2[n];
        });
        if (order2.join("") !== "0123456789") {
          return false;
        }
        var test3 = {};
        "abcdefghijklmnopqrst".split("").forEach(function(letter) {
          test3[letter] = letter;
        });
        if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") {
          return false;
        }
        return true;
      } catch (err) {
        return false;
      }
    }
    module2.exports = shouldUseNative() ? Object.assign : function(target, source) {
      var from;
      var to = toObject(target);
      var symbols;
      for (var s = 1; s < arguments.length; s++) {
        from = Object(arguments[s]);
        for (var key in from) {
          if (hasOwnProperty.call(from, key)) {
            to[key] = from[key];
          }
        }
        if (getOwnPropertySymbols) {
          symbols = getOwnPropertySymbols(from);
          for (var i = 0; i < symbols.length; i++) {
            if (propIsEnumerable.call(from, symbols[i])) {
              to[symbols[i]] = from[symbols[i]];
            }
          }
        }
      }
      return to;
    };
  }
});

// node_modules/vary/index.js
var require_vary = __commonJS({
  "node_modules/vary/index.js"(exports2, module2) {
    "use strict";
    module2.exports = vary;
    module2.exports.append = append;
    var FIELD_NAME_REGEXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
    function append(header, field) {
      if (typeof header !== "string") {
        throw new TypeError("header argument is required");
      }
      if (!field) {
        throw new TypeError("field argument is required");
      }
      var fields = !Array.isArray(field) ? parse(String(field)) : field;
      for (var j = 0; j < fields.length; j++) {
        if (!FIELD_NAME_REGEXP.test(fields[j])) {
          throw new TypeError("field argument contains an invalid header name");
        }
      }
      if (header === "*") {
        return header;
      }
      var val = header;
      var vals = parse(header.toLowerCase());
      if (fields.indexOf("*") !== -1 || vals.indexOf("*") !== -1) {
        return "*";
      }
      for (var i = 0; i < fields.length; i++) {
        var fld = fields[i].toLowerCase();
        if (vals.indexOf(fld) === -1) {
          vals.push(fld);
          val = val ? val + ", " + fields[i] : fields[i];
        }
      }
      return val;
    }
    function parse(header) {
      var end = 0;
      var list = [];
      var start = 0;
      for (var i = 0, len = header.length; i < len; i++) {
        switch (header.charCodeAt(i)) {
          case 32:
            if (start === end) {
              start = end = i + 1;
            }
            break;
          case 44:
            list.push(header.substring(start, end));
            start = end = i + 1;
            break;
          default:
            end = i + 1;
            break;
        }
      }
      list.push(header.substring(start, end));
      return list;
    }
    function vary(res, field) {
      if (!res || !res.getHeader || !res.setHeader) {
        throw new TypeError("res argument is required");
      }
      var val = res.getHeader("Vary") || "";
      var header = Array.isArray(val) ? val.join(", ") : String(val);
      if (val = append(header, field)) {
        res.setHeader("Vary", val);
      }
    }
  }
});

// node_modules/cors/lib/index.js
var require_lib = __commonJS({
  "node_modules/cors/lib/index.js"(exports2, module2) {
    (function() {
      "use strict";
      var assign = require_object_assign();
      var vary = require_vary();
      var defaults = {
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204
      };
      function isString(s) {
        return typeof s === "string" || s instanceof String;
      }
      function isOriginAllowed(origin, allowedOrigin) {
        if (Array.isArray(allowedOrigin)) {
          for (var i = 0; i < allowedOrigin.length; ++i) {
            if (isOriginAllowed(origin, allowedOrigin[i])) {
              return true;
            }
          }
          return false;
        } else if (isString(allowedOrigin)) {
          return origin === allowedOrigin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        } else {
          return !!allowedOrigin;
        }
      }
      function configureOrigin(options, req) {
        var requestOrigin = req.headers.origin, headers = [], isAllowed;
        if (!options.origin || options.origin === "*") {
          headers.push([{
            key: "Access-Control-Allow-Origin",
            value: "*"
          }]);
        } else if (isString(options.origin)) {
          headers.push([{
            key: "Access-Control-Allow-Origin",
            value: options.origin
          }]);
          headers.push([{
            key: "Vary",
            value: "Origin"
          }]);
        } else {
          isAllowed = isOriginAllowed(requestOrigin, options.origin);
          headers.push([{
            key: "Access-Control-Allow-Origin",
            value: isAllowed ? requestOrigin : false
          }]);
          headers.push([{
            key: "Vary",
            value: "Origin"
          }]);
        }
        return headers;
      }
      function configureMethods(options) {
        var methods = options.methods;
        if (methods.join) {
          methods = options.methods.join(",");
        }
        return {
          key: "Access-Control-Allow-Methods",
          value: methods
        };
      }
      function configureCredentials(options) {
        if (options.credentials === true) {
          return {
            key: "Access-Control-Allow-Credentials",
            value: "true"
          };
        }
        return null;
      }
      function configureAllowedHeaders(options, req) {
        var allowedHeaders = options.allowedHeaders || options.headers;
        var headers = [];
        if (!allowedHeaders) {
          allowedHeaders = req.headers["access-control-request-headers"];
          headers.push([{
            key: "Vary",
            value: "Access-Control-Request-Headers"
          }]);
        } else if (allowedHeaders.join) {
          allowedHeaders = allowedHeaders.join(",");
        }
        if (allowedHeaders && allowedHeaders.length) {
          headers.push([{
            key: "Access-Control-Allow-Headers",
            value: allowedHeaders
          }]);
        }
        return headers;
      }
      function configureExposedHeaders(options) {
        var headers = options.exposedHeaders;
        if (!headers) {
          return null;
        } else if (headers.join) {
          headers = headers.join(",");
        }
        if (headers && headers.length) {
          return {
            key: "Access-Control-Expose-Headers",
            value: headers
          };
        }
        return null;
      }
      function configureMaxAge(options) {
        var maxAge = (typeof options.maxAge === "number" || options.maxAge) && options.maxAge.toString();
        if (maxAge && maxAge.length) {
          return {
            key: "Access-Control-Max-Age",
            value: maxAge
          };
        }
        return null;
      }
      function applyHeaders(headers, res) {
        for (var i = 0, n = headers.length; i < n; i++) {
          var header = headers[i];
          if (header) {
            if (Array.isArray(header)) {
              applyHeaders(header, res);
            } else if (header.key === "Vary" && header.value) {
              vary(res, header.value);
            } else if (header.value) {
              res.setHeader(header.key, header.value);
            }
          }
        }
      }
      function cors2(options, req, res, next) {
        var headers = [], method = req.method && req.method.toUpperCase && req.method.toUpperCase();
        if (method === "OPTIONS") {
          headers.push(configureOrigin(options, req));
          headers.push(configureCredentials(options, req));
          headers.push(configureMethods(options, req));
          headers.push(configureAllowedHeaders(options, req));
          headers.push(configureMaxAge(options, req));
          headers.push(configureExposedHeaders(options, req));
          applyHeaders(headers, res);
          if (options.preflightContinue) {
            next();
          } else {
            res.statusCode = options.optionsSuccessStatus;
            res.setHeader("Content-Length", "0");
            res.end();
          }
        } else {
          headers.push(configureOrigin(options, req));
          headers.push(configureCredentials(options, req));
          headers.push(configureExposedHeaders(options, req));
          applyHeaders(headers, res);
          next();
        }
      }
      function middlewareWrapper(o) {
        var optionsCallback = null;
        if (typeof o === "function") {
          optionsCallback = o;
        } else {
          optionsCallback = function(req, cb) {
            cb(null, o);
          };
        }
        return function corsMiddleware(req, res, next) {
          optionsCallback(req, function(err, options) {
            if (err) {
              next(err);
            } else {
              var corsOptions = assign({}, defaults, options);
              var originCallback = null;
              if (corsOptions.origin && typeof corsOptions.origin === "function") {
                originCallback = corsOptions.origin;
              } else if (corsOptions.origin) {
                originCallback = function(origin, cb) {
                  cb(null, corsOptions.origin);
                };
              }
              if (originCallback) {
                originCallback(req.headers.origin, function(err2, origin) {
                  if (err2 || !origin) {
                    next(err2);
                  } else {
                    corsOptions.origin = origin;
                    cors2(corsOptions, req, res, next);
                  }
                });
              } else {
                next();
              }
            }
          });
        };
      }
      module2.exports = middlewareWrapper;
    })();
  }
});

// netlify/functions/api.js
var api_exports = {};
__export(api_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(api_exports);
var import_express = __toESM(require("express"), 1);
var import_serverless_http = __toESM(require_serverless_http(), 1);
var import_dotenv = __toESM(require_main(), 1);
var import_cors = __toESM(require_lib(), 1);
import_dotenv.default.config();
var api = (0, import_express.default)();
var router = import_express.default.Router();
api.use((0, import_cors.default)({
  origin: "*"
}));
router.get("/hello", (req, res) => res.send({ message: "Hello World!" }));
api.listen(5e3, () => {
  console.log("Backend is running on http://localhost:5000");
});
api.use("/api/", router);
var handler = (0, import_serverless_http.default)(api);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*! Bundled license information:

object-assign/index.js:
  (*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  *)

vary/index.js:
  (*!
   * vary
   * Copyright(c) 2014-2017 Douglas Christopher Wilson
   * MIT Licensed
   *)
*/
//# sourceMappingURL=api.js.map
