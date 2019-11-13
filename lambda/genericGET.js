const AWS = require(`aws-sdk`);
AWS.config.update({
	region: `eu-west-2`
});
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
	const TableName = event.queryStringParameters.table;
	const Key = {};
	Key[event.queryStringParameters.key] = event.queryStringParameters.value;

	dynamo.get({
		TableName,
		Key
	}, function (err, data) {
		if (err) {
			console.log(`error`, err);
			callback(err, null);
		} else {
			var response = {
				statusCode: 200,
				headers: {
					'Content-Type': `application/json`,
					'Access-Control-Allow-Origin': `http://static.easycoder.software`,
					'Access-Control-Allow-Credentials': true
				},
				body: JSON.stringify(data.Item),
				isBase64Encoded: false
			};
			console.log(`success: returned ${data.Item}`);
			callback(null, response);
		}
	});

};