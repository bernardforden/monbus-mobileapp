const AWS = require("aws-sdk");
AWS.config.apiVersions = {
    cognitoidentityserviceprovider: '2016-04-18'
};
AWS.config.update({ region: 'eu-west-1' });
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
var params = {
    UserPoolId: 'eu-west-1_xxxxxxxx', /* required */
    Username: 'xxxxxxxxxxxxxxxxxxxx', /* required */
    DesiredDeliveryMediums: ["EMAIL"],
    ForceAliasCreation: false,
    MessageAction: "SUPPRESS",
    TemporaryPassword: 'Test12345',
    UserAttributes: [
        {
            Name: 'email', /* required */
            Value: 'test@bernardforden.com'
        },
        {
            Name: 'email_verified', /* required */
            Value: 'True'
        }
    ],
    ValidationData: []
};
cognitoidentityserviceprovider.adminCreateUser(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data);           // successful response
});