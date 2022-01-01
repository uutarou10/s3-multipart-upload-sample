import {Handler, APIGatewayEvent} from 'aws-lambda'
import {CreateMultipartUploadCommand, CreateMultipartUploadRequest, S3Client} from '@aws-sdk/client-s3'
import {v4 as uuid} from 'uuid'

export const handler: Handler<APIGatewayEvent> = async (
  event,
  context
) => {
  const bucketName = process.env.S3_BUCKET_NAME
  const key = `${bucketName}/${uuid()}`

  const client = new S3Client({region: 'ap-northeast-1'})
  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: key
  })

  try {
    const {Key: key, UploadId: uploadId} = await client.send(command)
    return {
      body: JSON.stringify({key, uploadId}),
      statusCode: '201'
    }
  } catch (e) {
    console.error(e)
    return {
      body: JSON.stringify({message: 'Failed to invoke createMultipartUpload'}),
      statusCode: '500'
    }
  }
}
