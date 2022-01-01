import {CreateMultipartUploadCommand, UploadPartCommand, S3Client} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import {v4 as uuid} from 'uuid'
import serverlessExpress from '@vendia/serverless-express'
import express from 'express'

type ErrorResponseType = {
  message: string
}

const app = express()
app.use(express.json())

const createS3Client = () => {
  return new S3Client({region: 'ap-northeast-1'})
}
const bucketName = process.env.S3_BUCKET_NAME

app.post('/createMultipartUpload', async (req, res) => {
  const key = `${bucketName}/${uuid()}`
  const client = createS3Client()

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

type GetSignedUrlResponseType = {
  url: string
}
type GetSignedUrlRequestType = {
  key: string
  uploadId: string
  partNumber: number
}
app.post<{}, GetSignedUrlResponseType | ErrorResponseType, GetSignedUrlRequestType>('/getSignedUrl', async (req, res) => {
  const client = createS3Client()

  if (!req.body.key || !req.body.uploadId || !req.body.partNumber) {
    res.send({message: 'missing required params'})
    res.status(400)
    return
  }

  try {
    const command = new UploadPartCommand({
      Bucket: bucketName,
      PartNumber: req.body.partNumber,
      UploadId: req.body.uploadId,
      Key: req.body.key
    })
    const signedUrl = await getSignedUrl(client, command, {expiresIn: 60}) // expires in 1minute
    res.send({
      url: signedUrl
    })
    res.status(201)
  } catch (e) {
    console.error(e)
    res.send({
      message: 'Failed to issue signed url'
    })
  }
})

export const handler = serverlessExpress({app})

