const PanelMenu = imports.ui.panelMenu;
const { St, Gio, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;

const Me = ExtensionUtils.getCurrentExtension();

const MAIN_INTERVAL = 1000;
const MIN_ICON_CHANGE_INTERVAL = 500;

const settings = new ExtensionUtils.getSettings(
  "org.gnome.shell.extensions.service-status-indicator"
);

const STATUS_PRIORITY = {
  failure: 1,
  warning: 2,
  update: 3,
  ok: 4,
};
const STATUS_ICONS = {
  failure: Gio.icon_new_for_string(Me.dir.get_path() + "/icons/failure.png"),
  warning: Gio.icon_new_for_string(Me.dir.get_path() + "/icons/warning.png"),
  update: Gio.icon_new_for_string(Me.dir.get_path() + "/icons/update.png"),
  ok: Gio.icon_new_for_string(Me.dir.get_path() + "/icons/ok.png"),
};

let indicator;
let totalStatus = ""; // [failure > warning > update > ok] or "error"
let isRefreshing = false;

/**
 * Initializes the status indicator.
 *
 * This function creates a new `PanelMenu.Button` instance and sets it to be a
 * menu button in the system status area. It also creates a new icon for the button.
 *
 * @returns {void} This function does not return a value.
 */
function initIndicator() {
  // Set the indicator to a menu button
  indicator = new PanelMenu.Button(
    St.Align.START, // Positioning
    "service-status-indicator-button"
  );

  // Create an icon
  const iconPath = Me.dir.get_path() + "/icons/server.png";
  const icon = new St.Icon({
    gicon: Gio.icon_new_for_string(iconPath),
    style_class: "system-status-icon",
  });

  // Add the icon child to the menu button
  indicator.add_actor(icon);

  // Add the indicator to status area
  Main.panel.addToStatusArea("service-status-indicator", indicator);
}

/**
 * Spawns an asynchronous command with input/output pipes.
 * @param {Array} args - An array of command arguments.
 * @returns {Promise} A Promise that resolves with an object containing the stdout and stderr streams.
 * @throws {Error} If the command fails to spawn.
 */
function spawnAsyncWithPipes(args) {
  /**
   * Reads the output from the provided file descriptors and returns it as a string.
   *
   * @param {Number} stdout_fd - The file descriptor for the command's standard output.
   * @param {Number} stderr_fd - The file descriptor for the command's standard error.
   * @returns {Object} - An object containing the stdout and stderr output as strings.
   */
  function _readFdsOutput(stdout_fd, stderr_fd) {
    let stdout = "";
    const stdout_stream = new Gio.DataInputStream({
      base_stream: new Gio.UnixInputStream({ fd: stdout_fd }),
    });
    let [out, size] = stdout_stream.read_line(null);

    while (out !== null) {
      stdout += out;
      [out, size] = stdout_stream.read_line(null);
    }

    let stderr = "";
    const stderr_stream = new Gio.DataInputStream({
      base_stream: new Gio.UnixInputStream({ fd: stderr_fd }),
    });
    let [err_out, err_size] = stderr_stream.read_line(null);

    while (err_out !== null) {
      stderr += err_out;
      [err_out, err_size] = stderr_stream.read_line(null);
    }

    return { stdout, stderr };
  }

  const cmd_string = args.join(" ");

  // Spawns the command
  const [success, pid, stdin, stdout_fd, stderr_fd] =
    GLib.spawn_async_with_pipes(
      null, // working directory
      args, // command and arguments
      null, // environment variables
      GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.SEARCH_PATH, // flags
      null // child setup function
    );

  return new Promise((resolve, reject) => {
    // Checks if the command spawn successfully
    if (!success)
      reject(
        new Error(`Failed to spawn child process for command: "${cmd_string}"`)
      );

    // On child process exit
    GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, (pid, status) => {
      // TODO : Find out why status is always 0
      const { stdout, stderr } = _readFdsOutput(stdout_fd, stderr_fd);

      GLib.spawn_close_pid(pid);

      // Close the file descriptors
      GLib.close(stdin);
      GLib.close(stdout_fd);
      GLib.close(stderr_fd);

      resolve({ stdout, stderr });
    });
  });
}

/**
 * Validates that the services object has a valid schema or throws an error.
 * @param {Object} services - An object containing the services and their statuses.
 * @returns {Object} The validated services object.
 * @throws {Error} If the services schema is invalid.
 */
function validatedServices(services) {
  const err_msg = "Services schema validation failed: ";

  for (const [name, status] of Object.entries(services)) {
    if (STATUS_PRIORITY[status] === undefined)
      throw Error(
        err_msg +
          `${name} return ${status} as status which is not in Options [${Object.keys(
            STATUS_PRIORITY
          )}] `
      );
  }

  return services;
}

/**
 * Calls the services endpoint via `curl` and returns the list of services
 * in a validated format, or throws an error if the response is invalid.
 * @throws {Error} If the endpoint request fails or returns an invalid response
 * @returns {Promise<Object>} A promise that resolves with an object representing the
 * validated list of services, where each key is a service name and each value is a status.
 * The status value is one of `ok`, `update`, `warning`, or `failure`.
 */
async function getServices() {
  // Calls the services endpoint via curl
  const cmd = [
    "curl",
    "-m",
    "10",
    "-H",
    `AUTHORIZATION: Token ${settings.get_string("token")}`,
    settings.get_string("endpoint"),
  ];
  const { stdout, stderr } = await spawnAsyncWithPipes(cmd);

  // Checks for known errors
  if (stderr.includes("Connection timed out"))
    throw Error(`Couldn't get services: Connection timed out.`);
  else if (stdout === '{"error":"Unauthorized access"}')
    throw Error(
      "Couldn't get services: Invalid or missing Authentication-Token"
    );
  // Returns validated services object or throws en error
  else return validatedServices(JSON.parse(stdout));
}

/**
 * Sets a new icon for the indicator by replacing the old one.
 * @param {string} iconName - The name of the icon to use (without the .png extension)
 * @returns {void} This function doesn't return anything
 */
function setIndicatorIcon(iconName) {
  // Construct the full path to the icon file
  const iconPath = Me.dir.get_path() + `/icons/${iconName}.png`;

  // Create a new St.Icon object with the new icon
  const newIcon = new St.Icon({
    gicon: Gio.icon_new_for_string(iconPath),
    style_class: "system-status-icon",
  });

  // Get a reference to the old icon and replace it with the new one
  oldIcon = indicator.get_first_child();
  indicator.replace_child(oldIcon, newIcon);

  // Destroy the old icon to free up memory
  oldIcon.destroy();
}

/**
 * Sets the indicator's icon to blink between 'server' and 'server-failure' icons
 * at the specified interval until the total status changes to something other than 'failure'.
 */
function setIndicatorIconBlinkFailure() {
  const BLINK_INTERVAL = MIN_ICON_CHANGE_INTERVAL;

  /**
   * Blinks between 'server' and 'server-failure' icons at the specified interval
   * until the total status changes to something other than 'failure'.
   * @returns {boolean} true if blinking should continue, false otherwise
   */
  function _blink() {
    if (totalStatus != "failure") return false;
    const currentTimeInHalfSeconds = Math.floor(Date.now() / BLINK_INTERVAL);
    const iconName =
      currentTimeInHalfSeconds % 2 == 0 ? "server" : "server-failure";
    setIndicatorIcon(iconName);
    return true; // Keep blinking
  }

  GLib.timeout_add(GLib.PRIORITY_DEFAULT, BLINK_INTERVAL, _blink);
}

/**
 * Refreshes the server status indicator menu.
 *
 * This function retrieves the current services, determines the total status
 * based on their status priority, and creates a new menu with the corresponding
 * service menu items and icon. If an error occurs during this process, the function
 * sets the indicator's icon to "server-error" and logs the error.
 *
 * **This function must be called in an async context.**
 *
 * @returns {boolean} Always returns `false` to stop recalling the function.
 */
function refresh() {
  async function _doRefresh() {
    try {
      // Tries to retrieve the services
      services = await getServices();

      // Cleans the menu
      indicator.menu.removeAll();

      // Determines total status and creates the menu anew
      totalStatus = "ok";
      for (const [name, status] of Object.entries(services)) {
        // Determines the total status
        if (STATUS_PRIORITY[status] < STATUS_PRIORITY[totalStatus])
          totalStatus = status;

        // Creates service menu item with the corresponding icon
        const menuItem = new PopupMenu.PopupImageMenuItem(
          name,
          STATUS_ICONS[status]
        );

        // Adds it to the menu
        indicator.menu.addMenuItem(menuItem);
      }

      // Sets the corresponding indicator icon
      if (totalStatus == "failure") setIndicatorIconBlinkFailure();
      else setIndicatorIcon(`server-${totalStatus}`);
    } catch (error) {
      // Sets indicator's icon to error and logs the error
      setIndicatorIcon("server-error");
      totalStatus = "error";
      log(error);
    } finally {
      isRefreshing = false;
    }
  }

  _doRefresh();
  return false; // Stops recalling
}

/**
 * Sets the indicator's icon to a refreshing animation,
 * then sets it to the appropriate status icon after the minimum interval.
 * @function setIndicatorIconRefresh
 */
function setIndicatorIconRefresh() {
  function _resetIcon() {
    if (totalStatus) setIndicatorIcon(`server-${totalStatus}`);
    else setIndicatorIcon("server");
    return false;
  }
  setIndicatorIcon("server-refresh");
  GLib.timeout_add(GLib.PRIORITY_DEFAULT, MIN_ICON_CHANGE_INTERVAL, _resetIcon);
}

/**
 * Handles the refreshing mechanism for the indicator status.
 * It should be called in an asynchronous loop.
 *
 * This function uses a global flag to prevent multiple refreshes from occurring
 * simultaneously. It also sets a timeout value based on the current status of
 * the indicator. When the timeout expires, the `refresh()` function is called
 * and the process starts again.
 *
 * @returns {boolean} Returns `true` to indicate that the function has completed
 * one iteration of the refreshing mechanism, or `false` if the indicator has been
 * disabled and the refreshing mechanism should be stopped.
 */
function main() {
  if (!indicator) {
    return false;
  }

  if (!isRefreshing) {
    isRefreshing = true;

    if (totalStatus == "failure")
      GLib.timeout_add(
        GLib.PRIORITY_DEFAULT,
        settings.get_int("refresh-interval-on-failure") * 1000,
        refresh
      );
    else {
      setIndicatorIconRefresh();
      GLib.timeout_add(
        GLib.PRIORITY_DEFAULT,
        settings.get_int("refresh-interval") * 1000,
        refresh
      );
    }
  }

  return true;
}

function init() {}

function enable() {
  initIndicator();
  GLib.timeout_add(GLib.PRIORITY_DEFAULT, MAIN_INTERVAL, main);
}

function disable() {
  indicator.destroy();
  indicator = null;
}
