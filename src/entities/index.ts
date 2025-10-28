import { superdevClient } from "@/lib/superdev/client";

export const Notification = superdevClient.entity("Notification");
export const Order = superdevClient.entity("Order");
export const User = superdevClient.auth;