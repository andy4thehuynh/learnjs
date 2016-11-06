var http = require('http');
var AWS  = require('aws-sdk');

AWS.config.region = 'us-east-1';

var config = {
  dynamoTableName: 'banalbookmarks'
};

exports.dynamodb = new AWS.DynamoDB.DocumentClient();
console.log("hits the lambda service");

exports.fetchLinks = function(json, context) {  
  var item = {
    TableName: config.dynamoTableName,
    ProjectionExpression: "link",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": json.identity.id
    }
  };

  exports.dynamodb.query(item, function(err, data) {
    if (err) {
      context.fail(err);
    } else {
      context.succeed(data);
    }
  });
};
