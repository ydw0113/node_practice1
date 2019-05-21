const url = require("url");
const querystring = require("querystring");
const crypto = require("crypto");
const http = require("http");
const fs = require("fs");
const csvFilePath = "./getData.csv";
const json2csv = require("json2csv");
const csv2json = require("csvtojson");
const request = require("request");

const server = http
  .createServer((req, res) => {
    let urlParsed = url.parse(req.url);
    let queryParsed = querystring.parse(urlParsed.query);
    console.log(queryParsed);
    let id = queryParsed.id;
    let pw = queryParsed.pw;
    console.log(id);
    console.log(pw);

    if (urlParsed.pathname === "/signin") {
      let data = {
        msg: "",
        hashed: null,
        resultCsv: null
      };
      crypto.randomBytes(32, function(err, buffer) {
        if (err) {
          data.mse = "randomBytes 에러";

          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain");
          res.write(JSON.stringify(result));
          res.end();
        } else {
          crypto.pbkdf2(
            pw,
            buffer.toString("base64"),
            10000,
            64,
            "sha512",
            (err, hashed) => {
              if (err) {
                data.msg = "pbkdf2 에러";

                res.statusCode = 500;
                res.setHeader("Content-Type", "text/plain");
                res.write(JSON.stringify(result));
                res.end();
              } else {
                let pwHashed = hashed.toString("base64");
                let salt = buffer.toString("base64");

                const resultCsv = json2csv.parse({
                  id: id,
                  pw: pwHashed,
                  salt: salt
                });
                data.resultCsv = resultCsv;
                console.log(data.resultCsv);

                fs.writeFile("getData.csv", resultCsv, err => {
                  if (err) {
                    console.log("a");
                    data.msg = "파일 저장 에러";
                    res.writeHead(500, { "Content-Type": "text/plain" });
                    res.write(JSON.stringify(data));
                    res.end();
                  } else {
                    data.msg = "회원가입 성공";
                    data.hashed = hashed.toString("base64");
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "text/plain");
                    res.write(JSON.stringify(data));
                    res.end();
                    console.log(data);
                  }
                });
              }
            }
          );
        }
      });
      //  }
    } else if (urlParsed.pathname === "/signup") {
      csv2json()
        .fromFile(csvFilePath)
        .then(jsonObj => {
          const getsalt = jsonObj[0].salt;
          const getpw = jsonObj[0].pw;

          crypto.pbkdf2(
            pw,
            getsalt.toString("base64"),
            10000,
            64,
            "sha512",
            (err, hashed) => {
              if (err) {
                data.msg = "pbkdf2 에러";

                res.statusCode = 500;
                res.setHeader("Content-Type", "text/plain");
                res.write(JSON.stringify(result));
                res.end();
              } else {
                if (getpw === hashed.toString("base64")) {
                  console.log("로그인 성공!!");
                } else {
                  console.log("로그인 실패!");
                }
              }
            }
          );
        });
    } else if (urlParsed.pathname == "/info") {
      var data = {
        name: "유동완",
        phone: "010-0000-0000"
      };
      const options = {
        uri: "http://15.164.75.18:3000/homework/2nd",
        method: "POST",
        body: data,
        json: true
      };

      request(options, (err, response, body) => {
        if (err) {
          console.log(err);
          console.log("requset 에러");
        } else {
          const status = body.status;
          if (status == 400) {
            console.log("400 Error \n해당하는 회원이 없습니다. ");
          } else if (status == 404) {
            console.log(
              "404 Error \n요청하신 페이지를 찾을 수 없습니다.   URL경로 확인"
            );
          } else if (status == 500) {
            console.log("500 Error \n서버 내부에 오류가 있습니다. ");
          } else if (status == 200) {
            const student = body.data;
            crypto.randomBytes(32, (err, buf) => {
              if (err) {
                console.log(err);
                console.log("randomBytes 에러");
              } else {
                const salt = buf.toString("base64");
                crypto.pbkdf2(
                  student.phone,
                  salt,
                  10000,
                  64,
                  "SHA512",
                  (err, hashed) => {
                    if (err) {
                      console.log(err);
                      console.log("pbkdf2 에러");
                    } else {
                      pHhashed = hashed.toString("base64");
                      const studentCsv = json2csv.parse({
                        name: student.name,
                        colleage: student.colleage,
                        major: student.major,
                        email: student.email,
                        phHashed: pHhashed
                      });
                      fs.writeFile("student.csv", studentCsv, err => {
                        if (err) {
                          console.log("파일 저장 에러");
                        } else {
                          console.log(
                            "student.csv 파일로 정보가 저장되었습니다."
                          );
                        }
                      });
                    }
                  }
                );
              }
            });
          } else {
            console.log("오류!!");
          }
        }
      });
    }
  })
  .listen(3000, (req, res) => {
    console.log("3000 포트와 연결중!");
  });
