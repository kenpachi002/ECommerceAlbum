import React from "react";
import { CheckCircle, Clock, Package, Truck, MapPin, XCircle, Circle } from "lucide-react";

const STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "paid", label: "Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
];

function getStepIndex(status) {
  if (status === "cancelled") return -1;
  return STEPS.findIndex((s) => s.key === status);
}

export function DeliveryTracker({ status, timestamps, deliveryDueAt }) {
  if (status === "cancelled") {
    return (
      <div className="delivery-tracker delivery-tracker--cancelled">
        <div className="delivery-tracker__cancelled-badge">
          <XCircle size={20} />
          <span>Order Cancelled</span>
        </div>
        {timestamps?.cancelledAt && (
          <span className="delivery-tracker__time">{new Date(timestamps.cancelledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        )}
      </div>
    );
  }

  const currentIndex = getStepIndex(status);

  return (
    <div className="delivery-tracker">
      {deliveryDueAt && (
        <div className="delivery-tracker__due">
          Expected delivery: {new Date(deliveryDueAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      )}
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={step.key} className={`delivery-step${isCompleted ? " delivery-step--completed" : ""}${isCurrent ? " delivery-step--current" : ""}`}>
            <div className="delivery-step__line">
              {index > 0 && <div className={`delivery-step__connector${index <= currentIndex ? " delivery-step__connector--active" : ""}`} />}
            </div>
            <div className="delivery-step__icon">
              {isCompleted ? <Icon size={16} /> : <Circle size={14} />}
            </div>
            <div className="delivery-step__content">
              <span className="delivery-step__label">{step.label}</span>
              {timestamps?.[step.key + "At"] && (
                <span className="delivery-step__time">
                  {new Date(timestamps[step.key + "At"]).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
