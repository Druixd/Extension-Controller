# Extension Controller

A Chrome extension that enables other extensions only when specific websites are open. This helps improve browser performance and privacy by automatically disabling extensions when they're not needed.

## Features

- **Selective Extension Activation**: Enable extensions only when their designated websites are open
- **Two Activation Modes**:
  - `ANY`: Activate when any of the specified sites are open
  - `ALL`: Activate only when all specified sites are open
- **Real-time Monitoring**: Automatically tracks all open tabs and updates extension states
- **Easy Management**: Simple interface to configure which extensions to manage and their associated websites
- **Active Site Display**: Shows currently detected websites for easy reference

## Installation

1. Clone this repository or download the source code
2. Open any Chromium based browser and navigate to `chrome://extensions` 
3. Enable "Developer mode" (toggle in top right corner)
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your toolbar to open the management interface
2. Check the box next to extensions you want to manage
3. For each managed extension:
   - Add websites where the extension should be active
   - Choose between "ANY" or "ALL" activation mode
4. Click "Save Configuration" to apply your settings

The extension will automatically:
- Detect when you navigate to or from configured websites
- Enable/disable your extensions based on your rules
- Update when you open/close tabs or switch windows

## Permissions

This extension requires the following permissions:

- `tabs`: To monitor which websites are currently open
- `management`: To enable/disable other extensions
- `storage`: To save your configuration between sessions

## Development

The extension consists of three main files:

1. `background.js`: Handles the core logic of monitoring tabs and managing extensions
2. `popup.js`: Provides the user interface for configuration
3. `popup.html`: The interface layout

### Testing

The extension includes debug logging that can be viewed in the Chrome Extensions background page console.

## Contributing

Contributions are welcome! Please open an issue or pull request for any bugs or feature requests.

## License
[MIT](LICENSE)