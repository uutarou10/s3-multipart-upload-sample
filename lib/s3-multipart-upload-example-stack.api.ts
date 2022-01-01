import {CreateMultipartUploadCommand, S3Client} from '@aws-sdk/client-s3'
import {v4 as uuid} from 'uuid'
import serverlessExpress from '@vendia/serverless-express'
import express from 'express'

const app = express()

app.post('/createMultipartUpload', async (req, res) => {
  const bucketName = process.env.S3_BUCKET_NAME
  const key = `${bucketName}/${uuid()}`

  const client = new S3Client({region: 'ap-northeast-1'})
  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: key
  })

  try {
    const {Key: key, UploadId: uploadId} = await client.send(command)
    res.status(201)
    res.send({key, uploadId})
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send(
      {message: 'Failed to invoke createMultipartUpload'}
    )
  }
})

export const handler = serverlessExpress({app})

