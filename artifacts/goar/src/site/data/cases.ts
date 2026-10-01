export const cases = [
  { id: 'build', tab: 'Build an app', eye: 'For developers and personal projects', h: 'Make a change without returning to your desk.',
    p: 'Open your project, edit files and compile an Android app on your phone. For work that needs more resources, connect to your own SSH host and run the build there.',
    n: 'Build compatibility depends on your project, toolchain and available device resources.',
    s: [['Open and edit', 'Use Files, the code editor and Terminal.'], ['Build where it makes sense', 'Use the local sandbox or an external machine you configure.'], ['Keep the output with your project', 'Access the compiled APK from Files.']] },
  { id: 'market', tab: 'Reach customers', eye: 'For shops, freelancers and marketing teams', h: 'Prepare customer outreach in the same workspace.',
    p: 'Manage an audience and email campaign through your SMTP server. Use your Twilio account for SMS, or your Telegram bot for channel posts and messages.',
    n: 'Sending requires configured services. Account fees, consent requirements and provider limits still apply.',
    s: [['Choose the audience', 'Use your email audience and campaign tools.'], ['Prepare the message', 'Work on the copy in chat before using a sending tool.'], ['Use your own channels', 'Email through SMTP, SMS through Twilio, or posts through Telegram.']] },
  { id: 'pay', tab: 'Manage payments', eye: 'For service businesses and operations teams', h: 'Set up repeatable payment tasks.',
    p: 'Goar includes Stripe and PayPal tools for charging and payouts. Connect your accounts and configure the payment work you want the agent to carry out.',
    n: 'Use payment automation only with appropriate authorisation. Provider fees, eligibility and transaction rules apply.',
    s: [['Connect the payment service', 'Use your own Stripe or PayPal account.'], ['Define the task', 'Specify the intended charge or payout and its conditions.'], ['Check the result', 'Verify transactions in your payment provider’s records.']] },
  { id: 'team', tab: 'Work with a team', eye: 'For agencies and company teams', h: 'Share the workspace behind the work.',
    p: 'Share workspaces, import profiles from another app installation and use skills as repeatable instructions. Connect the external tools your team already uses through MCP.',
    n: 'Review company security requirements before sharing profiles, workspace data or connecting accounts.',
    s: [['Bring in a profile', 'Import an existing setup rather than starting again.'], ['Share the work', 'Use workspace sharing and playbooks for common tasks.'], ['Connect your services', 'Add MCP tools or use Telegram for team messages.']] },
];
export type UseCase = (typeof cases)[number];
