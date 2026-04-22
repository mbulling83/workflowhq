import { useState, useRef } from 'react'
import './EditablePrompt.css'

const SAVE_MESSAGES = [
  'Saved. Your agent has been briefed.',
  'Done. The robot knows what to do.',
  'Updated. The prompt lives on.',
  'Saved. Changes are now in effect.',
  'Got it. The agent will remember.',
]

interface EditablePromptProps {
  prompt: string
  workflowId: string
  nodeId: string
  onSave: (workflowId: string, nodeId: string, newPrompt: string) => Promise<void>
}

function EditablePrompt({ prompt, workflowId, nodeId, onSave }: EditablePromptProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPrompt, setEditedPrompt] = useState(prompt)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const lastMessageIndex = useRef(-1)

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
    setSuccess(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedPrompt(prompt)
    setError(null)
  }

  const handleSave = async () => {
    if (editedPrompt === prompt) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await onSave(workflowId, nodeId, editedPrompt)
      // Pick a different message each time
      let idx
      do { idx = Math.floor(Math.random() * SAVE_MESSAGES.length) }
      while (idx === lastMessageIndex.current && SAVE_MESSAGES.length > 1)
      lastMessageIndex.current = idx
      setSuccessMessage(SAVE_MESSAGES[idx])
      setSuccess(true)
      setIsEditing(false)

      setTimeout(() => setSuccess(false), 3500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt')
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className="editable-prompt editing">
        <div className="prompt-editor">
          <textarea
            className="prompt-textarea"
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            rows={10}
            disabled={isSaving}
            placeholder="Enter prompt..."
          />
          <div className="prompt-actions">
            <button
              className="prompt-button prompt-button-save"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="prompt-button prompt-button-cancel"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
          {error && <div className="prompt-error">{error}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="editable-prompt">
      <div className="prompt-view">
        <span className="detail-value prompt-text">{prompt}</span>
        <button
          className="prompt-edit-button"
          onClick={handleEdit}
          title="Edit prompt"
        >
          Edit
        </button>
      </div>
      {success && <div className="prompt-success">✓ {successMessage}</div>}
    </div>
  )
}

export default EditablePrompt
