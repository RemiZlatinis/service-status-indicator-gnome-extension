# Service Status Indicator Gnome Extension

## Demo

![service-status-indicator-gnome-extension-demo](demo/service-status-indicator-demo.gif)

## Description

The Service Status Indicator Gnome Extension is a Linux tool for monitoring the status of system updates, hardware stages, and various services. It relies on a backend API that provides essential data, including predefined check scripts for common use cases. You can also easily expand its functionality by creating and adding your own custom service checker and script.

## Target Audience

The Service Status Indicator Gnome Extension targets Linux users who want to have an eye on some services on some system. While it is primarily designed for server use, it can be used locally as well.

## Installation

### Prerequisites

Before installing the Service Status Indicator GNOME Extension, you need to have the Service Status Indicator API backend installed and running on the Linux machinethat you want to monitor. You can find more information about the backend installation and usage in the [Service Status Indicator API repository](https://github.com/RemiZlatinis/service_status_indicator_api.git).

### From GNOME Extensions (coming soon)

The Service Status Indicator GNOME Extension will soon be available to download and install directly from the GNOME Extensions. Stay tuned for updates!

### Manual Installation

To install the Service Status Indicator GNOME Extension manually from the Git repository, follow the instructions below:

1. Clone this repository:

   ```shell
   git clone https://github.com/RemiZlatinis/service-status-indicator-gnome-extension.git
   ```

2. Copy to gnome extenstions:

   ```shell
   cp service-status-indicator-gnome-extension ~/.local/share/gnome-shell/extensions/service-status-indicator@RemiZlatinis
   ```

3. Restart GNOME:

   - Press Alt + F2
   - Type "r" and Enter

4. Enable the extenstion:

   ```shell
   gnome-extensions enable service-status-indicator@RemiZlatinis
   ```

   That's it! The Service Status Indicator GNOME Extension should now be installed and enabled on your GNOME desktop environment.

## Usage

1. After installing the extension, navigate to the GNOME Extensions page in your web browser and enable the Service Status Indicator extension.
2. Open the extension settings by clicking the gear icon in the top right corner of the status indicator.
3. Set the URL for the backend API endpoint in the "Services API endpoint" field (e.g. http://localhost:8000).
4. Set the authentication token for the backend API in the "API Access Token" field.
5. The extension will now start monitoring the status of various services, hardware stages, and system updates on your Linux machine and display them in the status indicator.

**Note**: Please note that in order for the indicator to function properly, your backend must have at least one service checker. Otherwise, the response will be considered invalid.

## Contributing

If you would like to contribute to the Service Status Indicator Gnome Extension, please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to the project.

## Credits

The Service Status Indicator Gnome Extension was created by Apostolos Zlatinis and is licensed under the GPLv2 license.

Modifited icons from Flaticon are used

&#x2011;
<img src="icons/ok.png"  width="32" height="32">
<img src="icons/update.png"  width="32" height="32">
<img src="icons/warning.png"  width="32" height="32">
<img src="icons/failure.png"  width="32" height="32">
<img src="icons/server.png"  width="32" height="32">
<img src="icons/server-ok.png"  width="32" height="32">
<img src="icons/server-refresh.png"  width="32" height="32">
<img src="icons/server-update.png"  width="32" height="32">
<img src="icons/server-warning.png"  width="32" height="32">
<img src="icons/server-error.png"  width="32" height="32">

<a href="https://www.flaticon.com/free-icons/server" title="server icons">Server icons created by Roundicons - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/warning" title="warning icons">Warning icons created by Freepik - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/attention" title="attention icons">Attention icons created by bearicons - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/tick" title="tick icons">Tick icons created by Roundicons - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/update" title="update icons">Update icons created by Freepik - Flaticon</a>

## License

This project is licensed under the GPLv2 license. See the [LICENSE.md](LICENSE.md) file for details.
