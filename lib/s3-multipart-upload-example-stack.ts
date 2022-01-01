import { Stack, StackProps, aws_lambda_nodejs, aws_apigateway, aws_s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class S3MultipartUploadExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = aws_s3.Bucket.fromBucketArn(this, 'bucket', 'arn:aws:s3:::mogamin-playground')
    const apiLambdaFunction = new aws_lambda_nodejs.NodejsFunction(this, 'api', {
      environment: {
        'S3_BUCKET_NAME': bucket.bucketName
      }
    })
    bucket.grantReadWrite(apiLambdaFunction) // どんな権限が必要かわからなかったので一旦強めのつけてみている
    new aws_apigateway.LambdaRestApi(this, 'apigateway', {handler: apiLambdaFunction})
  }
}
