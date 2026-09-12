"""
Generate realistic demo transactions for Karis group Of Companies.
Writes SQL INSERT statements to 04_seed_transactions.sql
"""

import random
from datetime import date, timedelta

# Repeatable output — same numbers every run (good for demos)
random.seed(42)

business_id = 1
start_date = date.today() - timedelta(days=60)
end_date = date.today()

# Transaction categories
income_categories = [
    "Sales",
    "Bulk Order",
    "Online Order",
    "Church Order",
    "Market Day",
]
expense_categories = [
    "Supplies",
    "Transport",
    "Rent",
    "Utilities",
    "Marketing",
    "Packaging",
]

# Realistic descriptions (kept short so judges can read them)
income_descriptions = [
    "Sold fabric to walk-in customer",
    "Bulk order from local tailor",
    "Order via WhatsApp",
    "Weekend market sales",
    "Repeat customer purchase",
]
expense_descriptions = [
    "Bought fabric from wholesaler",
    "Tro-tro fare to Makola market",
    "Shop rent installment",
    "Electricity bill",
    "Printed flyers for promo",
    "Bought packaging materials",
]

rows = []
for _ in range(80):
    # Pick a random day within the last 60 days
    days_offset = random.randint(0, 60)
    d = start_date + timedelta(days=days_offset)

    # 60% income, 40% expense
    if random.random() < 0.6:
        t = "INCOME"
        amount = random.randint(80, 800)
        cat = random.choice(income_categories)
        desc = random.choice(income_descriptions)
    else:
        t = "EXPENSE"
        amount = random.randint(30, 400)
        cat = random.choice(expense_categories)
        desc = random.choice(expense_descriptions)

    # 40% of entries came from voice logging
    source = "VOICE" if random.random() < 0.4 else "MANUAL"

    rows.append(
        f"({business_id}, '{t}', {amount}.00, '{cat}', '{desc}', '{d}', '{source}')"
    )

# Sort so dates look chronological (nicer when browsing)
rows.sort()

# Write the SQL file
with open("database/04_seed_transactions.sql", "w", encoding="utf-8") as f:
    f.write("-- Auto-generated demo transactions for Akosua Fabrics\n")
    f.write(f"-- Business ID: {business_id}\n")
    f.write(f"-- Generated: {date.today()}\n")
    f.write(f"-- Count: {len(rows)} transactions\n\n")
    f.write("USE prospera_db;\n\n")
    f.write("INSERT INTO transactions\n")
    f.write("(business_id, type, amount, category, description, transaction_date, source)\n")
    f.write("VALUES\n")
    f.write(",\n".join(rows))
    f.write(";\n")

print(f"✅ Generated {len(rows)} transactions → database/04_seed_transactions.sql")