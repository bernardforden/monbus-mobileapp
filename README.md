+ Generated GraphQL operations successfully and saved at src/graphql
+ Uploaded files successfully.
+ All resources are updated in the cloud

- GraphQL endpoint: https://your-api-endpoint.appsync-api.eu-west-1.amazonaws.com/graphql
- Hosted UI Endpoint: https://your-cognito-endpoint.auth.eu-west-1.amazoncognito.com/
- Test Your Hosted UI Endpoint: https://your-cognito-endpoint.auth.eu-west-1.amazoncognito.com/login?response_type=code&client_id=&redirect_uri=https://monbus.bernardforden.com/signin/

1. How to configure Redirection_Uri from OAuth flow?
    UserPool Authorized redirect URIs:
    - https://your-cognito-endpoint.auth.eu-west-1.amazoncognito.com/oauth2/idpresponse
    After user loged into Cognito successfully, it will redirect to your SignIn Url
    - https://monbus.bernardforden.com/signin/?code=#
2. Exchange Authorization Code for Access Token
```Javascript
    POST https://your-cognito-endpoint.auth.eu-west-1.amazoncognito.com/oauth2/token
    Content-Type='application/x-www-form-urlencoded'
    
    grant_type:authorization_code
    client_id:
    code:
    redirect_uri:https://monbus.bernardforden.com/signin/
```
3. Create amplify-react mobile app
    - `expo init monbus`
    - `cd monbus`
    - `expo eject`
    - `cd ios`
    - `pod install` # need xcode xcrun, using it later
    
4. Common Dependancies:
    - `yarn add expo-web-browser`
    - `yarn add -D metro-react-native-babel-preset`
    - `yarn add react-native-ionicons`
    - `yarn add react-native-vector-icons`
    - `react-native link react-native-vector-icons`
    - `yarn add react-native-splash-screen`
    - `react-native link react-native-splash-screen`
    - `yarn add node-libs-react-native`
    - `yarn add react-native-level-fs`
    - `yarn add react-native-fs`
    - `react-native link react-native-fs`
    - `yarn add react-native-easy-grid`
    - `yarn add expo-sensors expo-location expo-permissions expo-constants`
    - `yarn add ngeohash`
    - `yarn install`
5. Amplify dependancies:
    - `yarn add aws-amplify aws-amplify-react-native`
    - `react-native link amazon-cognito-identity-js`
    - `yarn add @aws-amplify/pushnotification`
    - `react-native link @aws-amplify/pushnotification`
    - `react-native link amazon-cognito-identity-js`
    - `yarn add react-native-voice react-native-sound and react-native-fs`
    - `react-native link react-native-voice`
    - `react-native link react-native-fs`
    - `react-native link react-native-sound`

