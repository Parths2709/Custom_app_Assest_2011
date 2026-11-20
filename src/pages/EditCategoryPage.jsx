import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Container, Title, TextInput, Textarea, Button, Group, Paper, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'

function findCategory(id) {
  try {
    const stored = localStorage.getItem('categories')
    const categories = stored ? JSON.parse(stored) : []
    return categories.find((c) => String(c.id) === String(id)) || null
  } catch {
    return null
  }
}

export default function EditCategoryPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { state } = useLocation()

  const cat = state?.category || findCategory(id)
  const [name, setName] = useState(cat?.name || '')
  const [description, setDescription] = useState(cat?.description || '')

  if (!cat) {
    return (
      <Container size="sm" py="xl">
        <Text>Category not found.</Text>
        <Button mt="md" onClick={() => navigate('/')}>Back to list</Button>
      </Container>
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      const stored = localStorage.getItem('categories')
      const categories = stored ? JSON.parse(stored) : []
      const updated = categories.map((c) =>
        c.id === cat.id ? { ...c, name: name.trim(), description: description.trim() } : c,
      )
      localStorage.setItem('categories', JSON.stringify(updated))
      notifications.show({ message: 'Category updated', color: 'blue' })
      navigate('/')
    } catch {
      notifications.show({ message: 'Failed to update category', color: 'red' })
    }
  }

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">Edit Category</Title>
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
            <Button type="submit">Save</Button>
          </Group>
        </form>
      </Paper>
    </Container>
  )
}
