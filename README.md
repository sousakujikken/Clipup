# Clipup

This is an Electron-based Music-to-Movie conversion tool. It allows you to easily create a video file with background music from an audio file and a video file.
※ This application and documentation were primarily created using Claude 3.5 Sonnet and Deepseek v3.

## System Requirements

- **OS Support**:
  - Windows 10 or later
  - macOS 10.13 or later
  - Linux (Ubuntu 20.04+, Fedora 34+, or other modern distributions)
- **FFmpeg**: Version 4.0 or later (Will be installed automatically if not present)
- **Disk Space**: At least 500MB free space for installation
- **Memory**: Minimum 4GB RAM recommended

## Installation

### Windows

1. Download the latest `Clipup-Setup.exe` from the releases page
2. Run the installer
3. During first launch, if FFmpeg is not detected:
   - The application will prompt to install FFmpeg
   - Click "Yes" to allow automatic installation
   - Administrator privileges will be required for FFmpeg installation

Note: Windows may show a security warning when running the installer. This is normal as the application is not signed with a certificate. Click "More info" and then "Run anyway" to proceed.

### macOS

1. Download the latest `Clipup.zip` from the releases page
2. Extract the zip file
3. Move Clipup.app to your Applications folder
4. During first launch, if FFmpeg is not detected:
   - The application will prompt to install FFmpeg
   - Click "Yes" to allow automatic installation
   - You will be prompted for your password to install FFmpeg

Note: When first opening the app, macOS may show a security warning. To resolve this:
1. Go to System Settings > Privacy & Security
2. Scroll down to find the message about Clipup being blocked
3. Click "Open Anyway"

### Linux

#### Ubuntu/Debian
1. Download the latest `clipup.deb` from the releases page
2. Install using:
   ```bash
   sudo dpkg -i clipup.deb
   ```
3. During first launch, if FFmpeg is not detected:
   - The application will prompt to install FFmpeg
   - Click "Yes" to allow automatic installation
   - You will be prompted for your password to install FFmpeg

#### Fedora/RHEL
1. Download the latest `clipup.rpm` from the releases page
2. Install using:
   ```bash
   sudo rpm -i clipup.rpm
   ```

#### Other Distributions
1. Download the latest `clipup.AppImage` from the releases page
2. Make it executable:
   ```bash
   chmod +x clipup.AppImage
   ```
3. Run the AppImage

## Prerequisites

### Windows
- No additional prerequisites required
- Chocolatey package manager will be installed automatically if needed for FFmpeg installation

### macOS
- Homebrew package manager will be installed automatically if needed for FFmpeg installation
- Command Line Tools for Xcode will be installed automatically if needed

### Linux
- Basic development tools (`build-essential` on Ubuntu/Debian)
- `pkexec` or `sudo` for FFmpeg installation
- Package manager specific to your distribution (apt, dnf, etc.)

## Troubleshooting

### FFmpeg Installation Issues

If automatic FFmpeg installation fails, you can install it manually:

#### Windows
```powershell
# Using Chocolatey
choco install ffmpeg
```

#### macOS
```bash
# Using Homebrew
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

### Common Issues

1. **Application won't start**
   - Ensure you have sufficient disk space
   - Check system requirements are met
   - Try running as administrator (Windows) or with sudo (Linux)

2. **FFmpeg not found after installation**
   - Restart the application
   - Check if FFmpeg is in system PATH
   - Try manual installation steps above

3. **Permission errors**
   - Ensure you have write permissions in the application directory
   - Run installer with administrator privileges

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Look for similar issues in the GitHub issues
3. Create a new issue with:
   - Your OS version
   - Application version
   - Steps to reproduce the problem
   - Any error messages

## License

ISC License
