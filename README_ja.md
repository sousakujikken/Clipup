# Clipup

ElectronベースのMusic to Movie変換ツールです。音楽ファイルと動画ファイルから簡易的に音楽付き動画ファイルを作成することができます。
※このアプリケーション及びドキュメントは大部分をClaude 3.5 SonnetおよびDeepseek v3を用いて作成しました。

## システム要件

- **対応OS**:
  - Windows 10以降
  - macOS 10.13以降
  - Linux (Ubuntu 20.04+, Fedora 34+, その他の最新ディストリビューション)
- **FFmpeg**: バージョン4.0以降（未インストールの場合は自動的にインストールされます）
- **ディスク容量**: インストールに500MB以上の空き容量が必要
- **メモリ**: 4GB以上推奨

## インストール方法

### Windows

1. リリースページから最新の`Clipup-Setup.exe`をダウンロード
2. インストーラーを実行
3. 初回起動時、FFmpegが検出されない場合：
   - アプリケーションがFFmpegのインストールを提案します
   - 「はい」をクリックして自動インストールを許可
   - FFmpegのインストールには管理者権限が必要です

注意: インストーラー実行時にWindowsのセキュリティ警告が表示される場合があります。これは証明書未署名のためで正常な動作です。「詳細情報」→「実行」を選択して進めてください。

### macOS

1. リリースページから最新の`Clipup.zip`をダウンロード
2. zipファイルを解凍（ダブルクリックで開こうとすると信頼できないアプリケーションである旨の警告が出て開けない場合があります。zipファイルを右クリックして開くコンテキストメニューから「開く」を選択すると開けます。）
3. Clipup.appをApplicationsフォルダに移動
4. 初回起動時、FFmpegが検出されない場合：
   - アプリケーションがFFmpegのインストールを提案します
   - 「はい」をクリックして自動インストールを許可
   - FFmpegのインストールにはパスワードが必要です

注意: 初回起動時にmacOSのセキュリティ警告が表示される場合があります。解決方法：
1. システム設定 > プライバシーとセキュリティを開く
2. 「Clipupがブロックされました」というメッセージを探す
3. 「開く」をクリック

### Linux

#### Ubuntu/Debian
1. リリースページから最新の`clipup.deb`をダウンロード
2. 以下のコマンドでインストール：
   ```bash
   sudo dpkg -i clipup.deb
   ```
3. 初回起動時、FFmpegが検出されない場合：
   - アプリケーションがFFmpegのインストールを提案します
   - 「はい」をクリックして自動インストールを許可
   - FFmpegのインストールにはパスワードが必要です

#### Fedora/RHEL
1. リリースページから最新の`clipup.rpm`をダウンロード
2. 以下のコマンドでインストール：
   ```bash
   sudo rpm -i clipup.rpm
   ```

#### その他のディストリビューション
1. リリースページから最新の`clipup.AppImage`をダウンロード
2. 実行権限を付与：
   ```bash
   chmod +x clipup.AppImage
   ```
3. AppImageを実行

## 事前準備

### Windows
- 追加の準備は必要ありません
- FFmpegのインストールに必要なChocolateyパッケージマネージャーは自動的にインストールされます

### macOS
- FFmpegのインストールに必要なHomebrewパッケージマネージャーは自動的にインストールされます
- Command Line Tools for Xcodeは必要に応じて自動的にインストールされます

### Linux
- 基本的な開発ツール（Ubuntu/Debianの場合は`build-essential`）
- FFmpegのインストールには`pkexec`または`sudo`が必要
- ディストリビューション固有のパッケージマネージャー（apt, dnf等）

## トラブルシューティング

### FFmpegインストールの問題

自動インストールが失敗した場合、手動でインストールすることができます：

#### Windows
```powershell
# Chocolateyを使用
choco install ffmpeg
```

#### macOS
```bash
# Homebrewを使用
brew install ffmpeg
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# Fedora
sudo dnf install ffmpeg

# Arch Linux
sudo pacman -S ffmpeg
```

### よくある問題

1. **アプリケーションが起動しない**
   - 十分なディスク容量があることを確認
   - システム要件を満たしているか確認
   - 管理者権限（Windows）またはsudo（Linux）で実行してみる

2. **インストール後にFFmpegが見つからない**
   - アプリケーションを再起動
   - FFmpegがシステムPATHに含まれているか確認
   - 上記の手動インストール手順を試す

3. **権限エラー**
   - アプリケーションディレクトリへの書き込み権限があることを確認
   - インストーラーを管理者権限で実行

## サポート

問題が発生した場合：
1. 上記のトラブルシューティングセクションを確認
2. GitHubの既存のissuesで類似の問題を確認
3. 新しいissueを作成する際は以下を含めてください：
   - OSのバージョン
   - アプリケーションのバージョン
   - 問題の再現手順
   - エラーメッセージ

## ライセンス

ISC License
