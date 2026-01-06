# MinIO
### 有關container與檢查bucket是否存在
運行docker-compose.dev.yml，有兩個與MinIO有關的container會運行起來。第一個是MinIO本身container名為minio。第二個則是會運行初始化MinIO bucket的python檔案，叫做minio-init。

如果想要在啟動時檢查MinIO的bucket是否存在，就到/backend/initMinIO/minio_bucket_setup.py中的這一行code
```
    bucket = ["rsrp","rsrp-dt",...]
```
去新增就可以了。
另外，如果有修改MinIO的帳號或密碼，也要去這個檔案修改以下內容
```
client = Minio(
        "minio:9000",
        access_key="user",
        secret_key="password",
        secure=False
    )
```
這個container使用port9000與9001。但是API要用port 9000
access_key="帳號"
secret_key="password"
### MinIO的API
#### Minio(endpoint,access_key,secret_key,secure,...)
創建一個client。在使用其他API前都要先設定。
```
#創建client範例
client = Minio(
        "minio:9000",
        access_key="user",
        secret_key="password",
        secure=False #我們用http，不是https
    )
```
#### fput_object(bucket_name,object_name,file_path,...)
上傳檔案
```
#上傳 1.json 的檔案到名為 rsrp 的 bucket，上傳後的當名仍為 1.json
source_file = "1.json"
bucket_name = "rsrp"
destination_file = "1.json"
client.fput_object(
    bucket_name, destination_file, source_file,
)
```

#### fget_object(bucket_name,object_name,file_path,...)
下載檔案
```
#從 rsrp 下載名為1.json的檔案到./tmp/1.json
# The file to upload, change this path if needed
    bucket_name = "rsrp"
    object_name = "1.json"

    # 本地資料夾與檔案路徑
    download_folder = "./tmp"
    local_file_path = os.path.join(download_folder, object_name)

    # 下載物件到本地指定路徑
    client.fget_object(bucket_name, object_name, local_file_path)
```

#### remove_object(bucket_name,object_name,...)
```
    #刪除在 rsrp 的1.json

    #要刪除的檔案與bucket
    bucket_name = "rsrp"
    object_name = "1.json"

    client.remove_object(bucket_name,object_name)
```
