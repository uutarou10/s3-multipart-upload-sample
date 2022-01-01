import React from 'react';

const API_ENDPOINT = 'https://sm4egbgmx9.execute-api.ap-northeast-1.amazonaws.com/prod/'

const App = () => {
  const [targetFile, setTargetFile] = React.useState<File | null>(null)

  const onSubmitHandler = React.useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('submitted', e)
    targetFile && uploadToS3(targetFile)
    // targetFile && uploadToS3(targetFile).then(() => console.log('finished'))
  }, [targetFile])

  const onChangeFile = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetFile((e.target.files && e.target.files[0]) ?? null)
  }, [])

  return (
    <main>
      <h1>Multipart upload example</h1>
      <form onSubmit={onSubmitHandler}>
        <input type="file" name="file" onChange={onChangeFile} />
        <button type="submit" disabled={!targetFile}>upload</button>
      </form>
    </main>
  );
}

const uploadToS3 = async (file: File) => {
  // const partSize = 1024 * 1024 * 5 // 5MB

  const {uploadId, key} = await (await fetch(
    `${API_ENDPOINT}/createMultipartUpload`,
    {method: 'POST'}
  )).json() as {uploadId: string, key: string} // 雑

  const {url: signedUrl} = await (await fetch(
    `${API_ENDPOINT}/getSignedUrl`,
    {
      method: 'POST',
      body: JSON.stringify({
        key,
        uploadId,
        partNumber: 1 // TODO: 実際はパート数える
      }),
      headers: {'Content-Type': 'application/json'}
    }
  )).json() as {url: string}

  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    body: file
    // body: new Blob(file)
  })

  const etag = uploadResponse.headers.get('ETag')
  if (!etag) {
    console.log(uploadResponse.headers.keys())
    throw new Error('etag is empty')
  }

  console.log(etag)


  await fetch(
    `${API_ENDPOINT}/completeMultipartUpload`,
    {
      method: 'POST',
      body: JSON.stringify({
        key,
        uploadId,
        etags: [etag] // 実際は分割したパート順の配列を投げる
      }),
      headers: {'Content-Type': 'application/json'}
    }
  )

}

export default App;
