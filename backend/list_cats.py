from portfolios.models import AssetCategory

categories = AssetCategory.objects.all().order_by('name')
print(f"Total: {categories.count()}")
for c in categories:
    print(f"{c.id} - {c.name} (ordre: {c.ordre})")
