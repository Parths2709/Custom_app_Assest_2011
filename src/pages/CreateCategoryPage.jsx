import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Title, TextInput, Textarea, Button, Group, Paper } from '@mantine/core'
import { notifications } from '@mantine/notifications'

export default function CreateCategoryPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      const stored = localStorage.getItem('categories')
      const categories = stored ? JSON.parse(stored) : []
      const newCategory = { id: Date.now(), name: name.trim(), description: description.trim() }
      localStorage.setItem('categories', JSON.stringify([...categories, newCategory]))
      notifications.show({ message: 'Category created', color: 'green' })
      navigate('/')
    } catch {
      notifications.show({ message: 'Failed to save category', color: 'red' })
    }
  }

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">New Category</Title>
      <Paper withBorder p="lg">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Name"
            placeholder="Category name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            mb="md"
          />
          <Textarea
            label="Description"
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            mb="lg"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </Group>
        </form>
      </Paper>
    </Container>
  )
}
