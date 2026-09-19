import time
import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def send_order_confirmation_email(self, order_id):
    """
    Asynchronous Celery task to simulate PDF invoice generation
    and send email notification to the purchasing client.
    """
    from .models import Order

    try:
        order = Order.objects.select_related('client').get(id=order_id)
        logger.info(f"Generating PDF invoice for Order #{order.order_number}...")
        
        # Simulate PDF rendering computation delay
        time.sleep(1)

        subject = f"EnterpriseHub - Order Confirmation #{order.order_number}"
        message = (
            f"Dear {order.client.first_name or 'Valued Client'},\n\n"
            f"Thank you for your order #{order.order_number}.\n"
            f"Total Amount: ${order.total_amount:.2f}\n"
            f"Shipping Address: {order.shipping_address}\n\n"
            f"We are processing your order immediately."
        )

        # In production this will deliver email; in dev it prints to console log
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@enterprisehub.com'),
            recipient_list=[order.client.email],
            fail_silently=True,
        )
        logger.info(f"Order confirmation email successfully dispatched for Order #{order.order_number}")
        return f"Order #{order.order_number} processed successfully."
    except Order.DoesNotExist:
        logger.error(f"Order with ID {order_id} not found for email task.")
        return "Order not found."
    except Exception as exc:
        logger.error(f"Failed to process order email task: {exc}")
        raise self.retry(exc=exc)
