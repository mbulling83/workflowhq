type CreateIssueInput = {
  title: string
  body: string
  labels?: string[]
}

function getIssueConfig() {
  const token = process.env.GITHUB_ISSUES_TOKEN?.trim() ?? ''
  const repo = process.env.GITHUB_ISSUES_REPO?.trim() ?? ''
  if (!token || !repo || !repo.includes('/')) {
    return null
  }

  const [owner, name] = repo.split('/')
  if (!owner || !name) return null
  return { token, owner, name }
}

export async function createGitHubIssue(input: CreateIssueInput): Promise<void> {
  const config = getIssueConfig()
  if (!config) return

  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.name}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          title: input.title.slice(0, 256),
          body: input.body,
          labels: input.labels ?? [],
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[github-issues] create failed', response.status, errorText)
    }
  } catch (err) {
    console.error('[github-issues] request failed', err)
  }
}
