import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container, Title, Button, Table, Group, Text, Modal, Paper,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Electronics', description: 'Electronic devices and accessories' },
  { id: 2, name: 'Clothing', description: 'Apparel and fashion items' },
  { id: 3, name: 'Books', description: 'Books and educational materials' },
]

function loadCategories() {
  try {
    const stored = localStorage.getItem('categories')
    if (stored) return JSON.parse(stored)
    localStorage.setItem('categories', JSON.stringify(DEFAULT_CATEGORIES))
    return DEFAULT_CATEGORIES
  } catch {
    return DEFAULT_CATEGORIES
  }
}

export default function CategoriesPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState(loadCategories)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleDelete = (id) => {
    const updated = categories.filter((c) => c.id !== id)
    setCategories(updated)
    try { localStorage.setItem('categories', JSON.stringify(updated)) } catch {}
    setDeleteTarget(null)
    notifications.show({ message: 'Category deleted', color: 'red' })
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Categories</Title>
        <Button onClick={() => navigate('/categories/new')}>Add Category</Button>
      </Group>

      {categories.length === 0 ? (
        <Paper withBorder p="xl" ta="center">
          <Text c="dimmed">No categories yet. Add one to get started.</Text>
        </Paper>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th w={160}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {categories.map((cat) => (
              <Table.Tr key={cat.id}>
                <Table.Td>{cat.name}</Table.Td>
                <Table.Td>{cat.description}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() =>
                        navigate(`/categories/${cat.id}/edit`, { state: { category: cat } })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={() => setDeleteTarget(cat)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Delete"
        centered
      >
        <Text>Delete &ldquo;{deleteTarget?.name}&rdquo;? This cannot be undone.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button color="red" onClick={() => handleDelete(deleteTarget?.id)}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  )
}
