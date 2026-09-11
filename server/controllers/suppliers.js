const supplierGroups = [
  {
    id: 1,
    product: 'Beads & accessories',
    supplier: 'Kantamanto Wholesale',
    soloPrice: 35,
    groupPrice: 24,
    minOrders: 5,
    currentOrders: 3,
  },
  {
    id: 2,
    product: 'Fabric (Ankara / Kente)',
    supplier: 'Opera Market Suppliers',
    soloPrice: 65,
    groupPrice: 48,
    minOrders: 8,
    currentOrders: 5,
  },
  {
    id: 3,
    product: 'Packaging materials',
    supplier: 'ChinaAgent-GH',
    soloPrice: 12,
    groupPrice: 8,
    minOrders: 20,
    currentOrders: 14,
  },
]

export function listSupplierGroups(req, res) {
  res.json({ supplierGroups })
}

export function createSupplierGroup(req, res) {
  const { product, supplier, soloPrice, groupPrice, minOrders } = req.body

  if (!product || !soloPrice || !groupPrice || !minOrders) {
    return res.status(400).json({ message: 'Product, prices and min orders are required' })
  }

  const group = {
    id: supplierGroups.length + 1,
    product,
    supplier,
    soloPrice,
    groupPrice,
    minOrders,
    currentOrders: 1,
  }
  supplierGroups.push(group)
  res.status(201).json({ group })
}

export function joinSupplierGroup(req, res) {
  const { groupId } = req.body
  const group = supplierGroups.find((g) => g.id === Number(groupId))

  if (!group) {
    return res.status(404).json({ message: 'Supplier group not found' })
  }

  group.currentOrders = Math.min(group.currentOrders + 1, group.minOrders)
  res.json({ group })
}