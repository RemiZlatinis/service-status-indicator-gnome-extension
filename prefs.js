"use strict";

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

/**
 * This function fills the preferences window with the corresponding options.
 * @param {Adw.PreferencesWindow} window - The preferences window to fill.
 */
function fillPreferencesWindow(window) {
  const settings = ExtensionUtils.getSettings(
    "org.gnome.shell.extensions.service-status-indicator"
  );

  // Create a preferences page and group
  const page = new Adw.PreferencesPage();
  const group = new Adw.PreferencesGroup();
  page.add(group);

  // Refresh interval
  let row = new Adw.ActionRow({ title: "Refresh Interval" });
  group.add(row);
  const refresh_interval = new Gtk.SpinButton({
    adjustment: new Gtk.Adjustment({
      value: settings.get_int("refresh-interval"),
      lower: 1,
      upper: 3000,
      step_increment: 1,
      page_increment: 10,
      page_size: 0,
    }),
    valign: Gtk.Align.CENTER,
  });
  settings.bind(
    "refresh-interval",
    refresh_interval,
    "value",
    Gio.SettingsBindFlags.DEFAULT
  );
  row.add_suffix(refresh_interval);

  // Refresh interval on failure
  row = new Adw.ActionRow({ title: "Refresh Interval On Failure" });
  group.add(row);
  const refresh_interval_on_failure = new Gtk.SpinButton({
    adjustment: new Gtk.Adjustment({
      value: settings.get_int("refresh-interval-on-failure"),
      lower: 1,
      upper: 3000,
      step_increment: 1,
      page_increment: 10,
      page_size: 0,
    }),
    valign: Gtk.Align.CENTER,
  });
  settings.bind(
    "refresh-interval-on-failure",
    refresh_interval_on_failure,
    "value",
    Gio.SettingsBindFlags.DEFAULT
  );
  row.add_suffix(refresh_interval_on_failure);

  // API endpoint
  row = new Adw.ActionRow({ title: "Services API endpoint" });
  group.add(row);
  const endpoint = new Gtk.Entry({});
  settings.bind("endpoint", endpoint, "text", Gio.SettingsBindFlags.DEFAULT);
  row.add_suffix(endpoint);

  // Token
  row = new Adw.ActionRow({ title: "API Access Token" });
  group.add(row);
  const token = new Gtk.PasswordEntry({
    "show-peek-icon": true,
  });
  settings.bind("token", token, "text", Gio.SettingsBindFlags.DEFAULT);
  row.add_suffix(token);

  window.add(page);
}

/**
 * This function initializes the extension.
 */
function init() {}
