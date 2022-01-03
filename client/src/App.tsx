import React from 'react';

const API_ENDPOINT = 'https://sm4egbgmx9.execute-api.ap-northeast-1.amazonaws.com/prod'

const App = () => {
  const [targetFile, setTargetFile] = React.useState<File | null>(null)

  const onSubmitHandler = React.useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('submitted', e)
    targetFile && uploadToS3(targetFile)
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
  // multipart uploadを開始する
  // uploadIdを取得する
  const {uploadId, key} = await (await fetch(
    `${API_ENDPOINT}/createMultipartUpload`,
    {method: 'POST'}
  )).json() as {uploadId: string, key: string} // 雑

  // partごとに分割してアップロード
  const PART_SIZE = 1024 * 1024 * 5 // 5MB
  const fileSize = file.size;

  const etags: string[] = []
  let completedBytes = 0
  for(const i of [...Array(Math.ceil(fileSize / PART_SIZE))].map((_, i) => i)) {

    console.log(`part ${i + 1} start`)

    const sendData = file.slice(i * PART_SIZE, Math.min((i * PART_SIZE) + PART_SIZE, fileSize))
    const arrayBuffer = await sendData.arrayBuffer()

    const {url: signedUrl} = await (await fetch(
      `${API_ENDPOINT}/getSignedUrl`,
      {
        method: 'POST',
        body: JSON.stringify({
          key,
          uploadId,
          partNumber: i + 1
        }),
        headers: {'Content-Type': 'application/json'}
      }
    )).json() as {url: string}

    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: arrayBuffer
    })

    const etag = uploadResponse.headers.get('ETag')
    if (!etag) {
      console.log(uploadResponse.headers.keys())
      throw new Error('etag is empty')
    }

    etags.push(etag)
    completedBytes += sendData.size

    console.log(`${completedBytes/fileSize*100}% completed`)

    // return etag
  }

  await fetch(
    `${API_ENDPOINT}/completeMultipartUpload`,
    {
      method: 'POST',
      body: JSON.stringify({
        key,
        uploadId,
        etags
      }),
      headers: {'Content-Type': 'application/json'}
    }
  )

  alert(`Upload completed!\nkey: ${key}`)
}

export default App;
