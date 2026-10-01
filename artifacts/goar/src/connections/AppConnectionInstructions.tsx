export function AppConnectionInstructions() {
  return (
    <aside className="connection-instructions">
      <h2>Use these services with your app</h2>
      <p>Copy a service link and open it in Goar’s browser, or in your device’s browser. These are ordinary website links; they do not install an app or automatically add an MCP server.</p>
      <p>To use a remote machine with the agent, open Settings in the online service and enter an SSH host you are authorised to use. Keep passwords and private keys in the service’s own connection settings—not in a shared URL.</p>
      <p className="note">No app-specific import format or deep-link scheme was supplied. The links above are the supported connection method for this website.</p>
    </aside>
  );
}