import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CategoriesPage from './pages/CategoriesPage'
import CreateCategoryPage from './pages/CreateCategoryPage'
import EditCategoryPage from './pages/EditCategoryPage'

const basename = new URL(document.baseURI).pathname.replace(/\/[^/]*$/, '') || '/'

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<CategoriesPage />} />
        <Route path="/categories/new" element={<CreateCategoryPage />} />
        <Route path="/categories/:id/edit" element={<EditCategoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}
