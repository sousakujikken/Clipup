# Clipup

ElectronベースのMusic to Movie変換ツールです。音楽ファイルと動画ファイルから簡易的に音楽付き動画ファイルを作成することができます。

※ このアプリケーション及びドキュメントは大部分をClaude 3.5 SonnetおよびDeepseek v3を用いて作成しました。

※ 2025/2/3 今の所インストーラー版は不具合が解消できていません。下記インストール方法に記載の手順でインストールしてください。

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

1. Gitをインストール（未インストールの場合）：[Git公式サイト](https://git-scm.com/downloads)
2. Node.jsをインストール（推奨: 最新LTS版）：[Node.js公式サイト](https://nodejs.org/)
3. コマンドプロンプトまたはPowerShellを開き、以下のコマンドを実行：
   ```powershell
   git clone https://github.com/sousakujikken/Clipup.git
   cd Clipup
   npm install
   npm start
   ```

### macOS

1. Gitをインストール（未インストールの場合）：
   ```bash
   brew install git
   ```
2. Node.jsをインストール（推奨: 最新LTS版）：
   ```bash
   brew install node
   ```
3. ターミナルを開き、以下のコマンドを実行：
   ```bash
   git clone https://github.com/sousakujikken/Clipup.git
   cd Clipup
   npm install
   npm start
   ```

### Linux（Ubuntu/Debian/Fedoraなど）

1. Gitをインストール（未インストールの場合）：
   ```bash
   # Ubuntu/Debian系
   sudo apt update && sudo apt install git -y
   
   # Fedora系
   sudo dnf install git -y
   ```
2. Node.jsをインストール（推奨: 最新LTS版）：
   ```bash
   # Ubuntu/Debian系
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Fedora系
   sudo dnf module install nodejs:latest
   ```
3. ターミナルを開き、以下のコマンドを実行：
   ```bash
   git clone https://github.com/sousakujikken/Clipup.git
   cd Clipup
   npm install
   npm start
   ```

## 事前準備

### Windows
- GitおよびNode.jsのインストールが必要

### macOS
- Homebrewのインストールが推奨（未インストールの場合は[公式サイト](https://brew.sh/)を参照）

### Linux
- 各ディストリビューションのパッケージマネージャーを利用してGitおよびNode.jsをインストール

## トラブルシューティング

### npm installでエラーが発生する場合
1. Node.jsのバージョンを確認（推奨: 最新LTS版）
   ```bash
   node -v
   ```
2. `node_modules`と`package-lock.json`を削除し、再インストールを試行：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### FFmpegインストールの問題
手動でインストールする場合：

#### Windows
```powershell
choco install ffmpeg
```

#### macOS
```bash
brew install ffmpeg
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Fedora
sudo dnf install ffmpeg
```

## サポート

問題が発生した場合：
1. 上記のトラブルシューティングセクションを確認
2. GitHubの既存のissuesで類似の問題を確認
3. 新しいissueを作成する際は以下を含めてください：
   - OSのバージョン
   - Node.jsのバージョン
   - 問題の再現手順
   - エラーメッセージ

## ライセンス

ISC License

