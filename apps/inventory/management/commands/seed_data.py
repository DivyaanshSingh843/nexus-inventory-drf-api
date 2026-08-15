from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.authentication.models import User, UserRole
from apps.inventory.models import Category, Product, StockMovement, StockMovementType
from apps.orders.models import Order, OrderItem, OrderStatus


class Command(BaseCommand):
    help = 'Seeds database with initial enterprise demo data (Users, Categories, Products, Orders, Stock logs)'

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding process...")

        with transaction.atomic():
            # 1. Create Users
            admin, _ = User.objects.get_or_create(
                email='admin@enterprisehub.com',
                defaults={
                    'username': 'admin@enterprisehub.com',
                    'first_name': 'Super',
                    'last_name': 'Admin',
                    'role': UserRole.ADMIN,
                    'is_staff': True,
                    'is_superuser': True,
                    'company_name': 'EnterpriseHub HQ'
                }
            )
            admin.set_password('admin123')
            admin.save()

            manager, _ = User.objects.get_or_create(
                email='manager@enterprisehub.com',
                defaults={
                    'username': 'manager@enterprisehub.com',
                    'first_name': 'Sarah',
                    'last_name': 'Manager',
                    'role': UserRole.MANAGER,
                    'company_name': 'EnterpriseHub Logistics'
                }
            )
            manager.set_password('manager123')
            manager.save()

            staff, _ = User.objects.get_or_create(
                email='staff@enterprisehub.com',
                defaults={
                    'username': 'staff@enterprisehub.com',
                    'first_name': 'David',
                    'last_name': 'Warehouse',
                    'role': UserRole.STAFF,
                    'company_name': 'EnterpriseHub Logistics'
                }
            )
            staff.set_password('staff123')
            staff.save()

            client, _ = User.objects.get_or_create(
                email='client@acmecorp.com',
                defaults={
                    'username': 'client@acmecorp.com',
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'role': UserRole.CLIENT,
                    'company_name': 'Acme Global Industries',
                    'address': '100 Industrial Parkway, Tech City'
                }
            )
            client.set_password('client123')
            client.save()

            # 2. Create Categories
            cat_elec, _ = Category.objects.get_or_create(
                name='Enterprise Electronics',
                defaults={'description': 'Servers, networking hardware, and IoT controllers'}
            )
            cat_raw, _ = Category.objects.get_or_create(
                name='Raw Materials',
                defaults={'description': 'Industrial metals, polymers, and raw composites'}
            )
            cat_mach, _ = Category.objects.get_or_create(
                name='Heavy Machinery Parts',
                defaults={'description': 'Hydraulics, bearings, and precision motors'}
            )

            # 3. Create Products
            products_data = [
                {
                    'sku': 'SKU-ELEC-101',
                    'name': 'High-Density Rack Server 2U',
                    'category': cat_elec,
                    'price': Decimal('2499.99'),
                    'cost_price': Decimal('1800.00'),
                    'quantity_in_stock': 45,
                    'reorder_level': 10
                },
                {
                    'sku': 'SKU-ELEC-102',
                    'name': 'Industrial Gigabit Ethernet Switch 48-Port',
                    'category': cat_elec,
                    'price': Decimal('899.50'),
                    'cost_price': Decimal('550.00'),
                    'quantity_in_stock': 8,  # Low stock
                    'reorder_level': 10
                },
                {
                    'sku': 'SKU-RAW-201',
                    'name': 'Anodized Aluminum Alloy Sheets (10-Pack)',
                    'category': cat_raw,
                    'price': Decimal('450.00'),
                    'cost_price': Decimal('280.00'),
                    'quantity_in_stock': 120,
                    'reorder_level': 20
                },
                {
                    'sku': 'SKU-MACH-301',
                    'name': 'Precision Hydraulic Cylinder Assembly',
                    'category': cat_mach,
                    'price': Decimal('1250.00'),
                    'cost_price': Decimal('800.00'),
                    'quantity_in_stock': 0,  # Out of stock
                    'reorder_level': 5
                },
            ]

            created_products = []
            for pdata in products_data:
                product, created = Product.objects.get_or_create(
                    sku=pdata['sku'],
                    defaults=pdata
                )
                created_products.append(product)
                if created:
                    StockMovement.objects.create(
                        product=product,
                        movement_type=StockMovementType.INBOUND,
                        quantity=pdata['quantity_in_stock'],
                        reference='INITIAL-SEED',
                        performed_by=admin,
                        notes='Initial warehouse stock seeding'
                    )

            # 4. Create Demo Order
            order, o_created = Order.objects.get_or_create(
                order_number='ORD-SEED-0001',
                defaults={
                    'client': client,
                    'status': OrderStatus.COMPLETED,
                    'total_amount': Decimal('3399.49'),
                    'shipping_address': '100 Industrial Parkway, Tech City',
                    'notes': 'Urgent B2B shipment'
                }
            )

            if o_created:
                p1 = created_products[0]
                p2 = created_products[1]
                OrderItem.objects.create(
                    order=order,
                    product=p1,
                    quantity=1,
                    unit_price=p1.price,
                    subtotal=p1.price
                )
                OrderItem.objects.create(
                    order=order,
                    product=p2,
                    quantity=1,
                    unit_price=p2.price,
                    subtotal=p2.price
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded enterprise database!"))
        self.stdout.write("Credentials created:")
        self.stdout.write("  - Admin:   admin@enterprisehub.com / admin123")
        self.stdout.write("  - Manager: manager@enterprisehub.com / manager123")
        self.stdout.write("  - Staff:   staff@enterprisehub.com / staff123")
        self.stdout.write("  - Client:  client@acmecorp.com / client123")
