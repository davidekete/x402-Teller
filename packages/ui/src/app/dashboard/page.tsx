"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { RevenueChart, type Transaction } from "./components/revenue-chart";
import { PaymentsTable } from "./components/payments-table";
import { EndpointsTable } from "./components/endpoints-table";
import { WithdrawModal } from "./components/withdraw-modal";
import { useWallet } from "@solana/wallet-adapter-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { fetchTransactions, fetchBalance } from "@/lib/api";
import { LogOut, TrendingDown, TrendingUp, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

const defaultPayments: Transaction[] = [
  // 2024 Historical Data (12 months x 5 payments each)
  // January 2024 (5 payments)
  {
    txID: 101,
    client: "P1aA2...bB33",
    txHash: "0xP1aA2bB33aa",
    amount: "180.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-01-05T08:30:00Z",
    createdAt: "2024-01-05T08:30:00Z",
    updatedAt: "2024-01-05T08:35:00Z",
  },
  {
    txID: 102,
    client: "Q2cC3...dD44",
    txHash: "0xQ2cC3dD44bb",
    amount: "290.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2024-01-10T10:12:00Z",
  },
  {
    txID: 103,
    client: "R3eE4...fF55",
    txHash: "0xR3eE4fF55cc",
    amount: "420.50",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-01-15T14:20:00Z",
    createdAt: "2024-01-15T14:20:00Z",
  },
  {
    txID: 104,
    client: "S4gG5...hH66",
    txHash: "0xS4gG5hH66dd",
    amount: "55.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-01-18T16:40:00Z",
  },
  {
    txID: 105,
    client: "T5iI6...jJ77",
    txHash: "0xT5iI6jJ77ee",
    amount: "750.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-01-25T09:05:00Z",
    createdAt: "2024-01-25T09:05:00Z",
  },

  // February 2024 (5 payments)
  {
    txID: 106,
    client: "U6kK7...lL88",
    txHash: "0xU6kK7lL88ff",
    amount: "620.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-02-02T11:15:00Z",
    createdAt: "2024-02-02T11:15:00Z",
    updatedAt: "2024-02-02T11:20:00Z",
  },
  {
    txID: 107,
    client: "V7mM8...nN99",
    txHash: "0xV7mM8nN99gg",
    amount: "310.00",
    endpoint: "/payments",
    network: "solana",
    asset: "USDC",
    status: "pending",
    time: "2024-02-08T13:30:30Z",
  },
  {
    txID: 108,
    client: "W8oO9...pP10",
    txHash: "0xW8oO9pP10hh",
    amount: "880.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-02-14T17:45:10Z",
    createdAt: "2024-02-14T17:45:10Z",
  },
  {
    txID: 109,
    client: "X9qQ1...rR11",
    txHash: "0xX9qQ1rR11ii",
    amount: "42.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-02-19T07:15:55Z",
  },
  {
    txID: 110,
    client: "Y0sS2...tT12",
    txHash: "0xY0sS2tT12jj",
    amount: "1100.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-02-28T14:50:00Z",
    createdAt: "2024-02-28T14:50:00Z",
  },

  // March 2024 (5 payments)
  {
    txID: 111,
    client: "Z1uU3...vV13",
    txHash: "0xZ1uU3vV13kk",
    amount: "550.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-03-03T09:20:00Z",
    createdAt: "2024-03-03T09:20:00Z",
    updatedAt: "2024-03-03T09:25:00Z",
  },
  {
    txID: 112,
    client: "A2wW4...xX14",
    txHash: "0xA2wW4xX14ll",
    amount: "275.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2024-03-10T12:35:30Z",
  },
  {
    txID: 113,
    client: "B3yY5...zZ15",
    txHash: "0xB3yY5zZ15mm",
    amount: "725.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-03-17T15:50:10Z",
    createdAt: "2024-03-17T15:50:10Z",
  },
  {
    txID: 114,
    client: "C4aA6...bB16",
    txHash: "0xC4aA6bB16nn",
    amount: "68.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-03-22T18:10:00Z",
  },
  {
    txID: 115,
    client: "D5cC7...dD17",
    txHash: "0xD5cC7dD17oo",
    amount: "920.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-03-28T10:40:00Z",
    createdAt: "2024-03-28T10:40:00Z",
  },

  // April 2024 (5 payments)
  {
    txID: 116,
    client: "E6eE8...fF18",
    txHash: "0xE6eE8fF18pp",
    amount: "410.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-04-02T08:15:00Z",
    createdAt: "2024-04-02T08:15:00Z",
    updatedAt: "2024-04-02T08:20:00Z",
  },
  {
    txID: 117,
    client: "F7gG9...hH19",
    txHash: "0xF7gG9hH19qq",
    amount: "245.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2024-04-09T11:22:30Z",
  },
  {
    txID: 118,
    client: "G8iI0...jJ20",
    txHash: "0xG8iI0jJ20rr",
    amount: "635.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-04-16T16:30:10Z",
    createdAt: "2024-04-16T16:30:10Z",
  },
  {
    txID: 119,
    client: "H9kK1...lL21",
    txHash: "0xH9kK1lL21ss",
    amount: "73.50",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-04-20T19:25:00Z",
  },
  {
    txID: 120,
    client: "I0mM2...nN22",
    txHash: "0xI0mM2nN22tt",
    amount: "1050.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-04-27T13:35:00Z",
    createdAt: "2024-04-27T13:35:00Z",
  },

  // May 2024 (5 payments)
  {
    txID: 121,
    client: "J1oO3...pP23",
    txHash: "0xJ1oO3pP23uu",
    amount: "380.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-05-03T10:10:00Z",
    createdAt: "2024-05-03T10:10:00Z",
    updatedAt: "2024-05-03T10:15:00Z",
  },
  {
    txID: 122,
    client: "K2qQ4...rR24",
    txHash: "0xK2qQ4rR24vv",
    amount: "290.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2024-05-09T12:45:30Z",
  },
  {
    txID: 123,
    client: "L3sS5...tT25",
    txHash: "0xL3sS5tT25ww",
    amount: "815.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-05-15T14:55:10Z",
    createdAt: "2024-05-15T14:55:10Z",
  },
  {
    txID: 124,
    client: "M4uU6...vV26",
    txHash: "0xM4uU6vV26xx",
    amount: "51.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-05-20T17:20:00Z",
  },
  {
    txID: 125,
    client: "N5wW7...xX27",
    txHash: "0xN5wW7xX27yy",
    amount: "960.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-05-29T11:30:00Z",
    createdAt: "2024-05-29T11:30:00Z",
  },

  // June 2024 (5 payments)
  {
    txID: 126,
    client: "O6yY8...zZ28",
    txHash: "0xO6yY8zZ28zz",
    amount: "520.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-06-02T09:15:00Z",
    createdAt: "2024-06-02T09:15:00Z",
    updatedAt: "2024-06-02T09:20:00Z",
  },
  {
    txID: 127,
    client: "P7aA9...bB29",
    txHash: "0xP7aA9bB29aa",
    amount: "340.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2024-06-08T13:40:30Z",
  },
  {
    txID: 128,
    client: "Q8cC0...dD30",
    txHash: "0xQ8cC0dD30bb",
    amount: "745.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-06-16T16:25:10Z",
    createdAt: "2024-06-16T16:25:10Z",
  },
  {
    txID: 129,
    client: "R9eE1...fF31",
    txHash: "0xR9eE1fF31cc",
    amount: "62.50",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-06-21T18:50:00Z",
  },
  {
    txID: 130,
    client: "S0gG2...hH32",
    txHash: "0xS0gG2hH32dd",
    amount: "1080.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-06-28T12:05:00Z",
    createdAt: "2024-06-28T12:05:00Z",
  },

  // July 2024 (5 payments)
  {
    txID: 131,
    client: "T1iI3...jJ33",
    txHash: "0xT1iI3jJ33ee",
    amount: "605.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-07-04T10:30:00Z",
    createdAt: "2024-07-04T10:30:00Z",
    updatedAt: "2024-07-04T10:35:00Z",
  },
  {
    txID: 132,
    client: "U2kK4...lL34",
    txHash: "0xU2kK4lL34ff",
    amount: "320.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2024-07-11T14:15:30Z",
  },
  {
    txID: 133,
    client: "V3mM5...nN35",
    txHash: "0xV3mM5nN35gg",
    amount: "890.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-07-18T17:40:10Z",
    createdAt: "2024-07-18T17:40:10Z",
  },
  {
    txID: 134,
    client: "W4oO6...pP36",
    txHash: "0xW4oO6pP36hh",
    amount: "46.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-07-23T08:05:55Z",
  },
  {
    txID: 135,
    client: "X5qQ7...rR37",
    txHash: "0xX5qQ7rR37ii",
    amount: "1200.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-07-30T15:20:00Z",
    createdAt: "2024-07-30T15:20:00Z",
  },

  // August 2024 (5 payments)
  {
    txID: 136,
    client: "Y6sS8...tT38",
    txHash: "0xY6sS8tT38jj",
    amount: "475.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-08-02T09:45:00Z",
    createdAt: "2024-08-02T09:45:00Z",
    updatedAt: "2024-08-02T09:50:00Z",
  },
  {
    txID: 137,
    client: "Z7uU9...vV39",
    txHash: "0xZ7uU9vV39kk",
    amount: "365.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2024-08-09T11:30:30Z",
  },
  {
    txID: 138,
    client: "A8wW0...xX40",
    txHash: "0xA8wW0xX40ll",
    amount: "760.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-08-17T15:10:10Z",
    createdAt: "2024-08-17T15:10:10Z",
  },
  {
    txID: 139,
    client: "B9yY1...zZ41",
    txHash: "0xB9yY1zZ41mm",
    amount: "38.50",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-08-22T19:35:00Z",
  },
  {
    txID: 140,
    client: "C0aA2...bB42",
    txHash: "0xC0aA2bB42nn",
    amount: "1150.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-08-29T13:15:00Z",
    createdAt: "2024-08-29T13:15:00Z",
  },

  // September 2024 (5 payments)
  {
    txID: 141,
    client: "D1cC3...dD43",
    txHash: "0xD1cC3dD43oo",
    amount: "530.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-09-03T08:20:00Z",
    createdAt: "2024-09-03T08:20:00Z",
    updatedAt: "2024-09-03T08:25:00Z",
  },
  {
    txID: 142,
    client: "E2eE4...fF44",
    txHash: "0xE2eE4fF44pp",
    amount: "295.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2024-09-10T12:50:30Z",
  },
  {
    txID: 143,
    client: "F3gG5...hH45",
    txHash: "0xF3gG5hH45qq",
    amount: "820.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-09-17T16:15:10Z",
    createdAt: "2024-09-17T16:15:10Z",
  },
  {
    txID: 144,
    client: "G4iI6...jJ46",
    txHash: "0xG4iI6jJ46rr",
    amount: "54.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-09-22T07:40:55Z",
  },
  {
    txID: 145,
    client: "H5kK7...lL47",
    txHash: "0xH5kK7lL47ss",
    amount: "1010.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-09-29T14:25:00Z",
    createdAt: "2024-09-29T14:25:00Z",
  },

  // October 2024 (5 payments)
  {
    txID: 146,
    client: "I6mM8...nN48",
    txHash: "0xI6mM8nN48tt",
    amount: "445.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-10-02T10:05:00Z",
    createdAt: "2024-10-02T10:05:00Z",
    updatedAt: "2024-10-02T10:10:00Z",
  },
  {
    txID: 147,
    client: "J7oO9...pP49",
    txHash: "0xJ7oO9pP49uu",
    amount: "355.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2024-10-08T13:20:30Z",
  },
  {
    txID: 148,
    client: "K8qQ0...rR50",
    txHash: "0xK8qQ0rR50vv",
    amount: "705.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-10-15T15:45:10Z",
    createdAt: "2024-10-15T15:45:10Z",
  },
  {
    txID: 149,
    client: "L9sS1...tT51",
    txHash: "0xL9sS1tT51ww",
    amount: "71.50",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-10-20T18:30:00Z",
  },
  {
    txID: 150,
    client: "M0uU2...vV52",
    txHash: "0xM0uU2vV52xx",
    amount: "980.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-10-27T11:50:00Z",
    createdAt: "2024-10-27T11:50:00Z",
  },

  // November 2024 (5 payments)
  {
    txID: 151,
    client: "N1wW3...xX53",
    txHash: "0xN1wW3xX53yy",
    amount: "590.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-11-04T09:30:00Z",
    createdAt: "2024-11-04T09:30:00Z",
    updatedAt: "2024-11-04T09:35:00Z",
  },
  {
    txID: 152,
    client: "O2yY4...zZ54",
    txHash: "0xO2yY4zZ54zz",
    amount: "270.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2024-11-10T12:15:30Z",
  },
  {
    txID: 153,
    client: "P3aA5...bB55",
    txHash: "0xP3aA5bB55aa",
    amount: "875.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-11-17T16:40:10Z",
    createdAt: "2024-11-17T16:40:10Z",
  },
  {
    txID: 154,
    client: "Q4cC6...dD56",
    txHash: "0xQ4cC6dD56bb",
    amount: "49.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-11-22T08:55:00Z",
  },
  {
    txID: 155,
    client: "R5eE7...fF57",
    txHash: "0xR5eE7fF57cc",
    amount: "1095.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-11-29T14:10:00Z",
    createdAt: "2024-11-29T14:10:00Z",
  },

  // December 2024 (5 payments)
  {
    txID: 156,
    client: "S6gG8...hH58",
    txHash: "0xS6gG8hH58dd",
    amount: "510.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-12-02T10:45:00Z",
    createdAt: "2024-12-02T10:45:00Z",
    updatedAt: "2024-12-02T10:50:00Z",
  },
  {
    txID: 157,
    client: "T7iI9...jJ59",
    txHash: "0xT7iI9jJ59ee",
    amount: "385.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2024-12-09T14:20:30Z",
  },
  {
    txID: 158,
    client: "U8kK0...lL60",
    txHash: "0xU8kK0lL60ff",
    amount: "795.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-12-16T17:55:10Z",
    createdAt: "2024-12-16T17:55:10Z",
  },
  {
    txID: 159,
    client: "V9mM1...nN61",
    txHash: "0xV9mM1nN61gg",
    amount: "57.50",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2024-12-21T09:30:00Z",
  },
  {
    txID: 160,
    client: "W0oO2...pP62",
    txHash: "0xW0oO2pP62hh",
    amount: "1240.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2024-12-28T15:15:00Z",
    createdAt: "2024-12-28T15:15:00Z",
  },

  // 2023 Historical Data (6 months sample x 5 payments each)
  // July 2023 (5 payments)
  {
    txID: 201,
    client: "X1qQ3...rR63",
    txHash: "0xX1qQ3rR63ii",
    amount: "210.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-07-05T08:10:00Z",
    createdAt: "2023-07-05T08:10:00Z",
    updatedAt: "2023-07-05T08:15:00Z",
  },
  {
    txID: 202,
    client: "Y2sS4...tT64",
    txHash: "0xY2sS4tT64jj",
    amount: "305.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2023-07-12T11:25:30Z",
  },
  {
    txID: 203,
    client: "Z3uU5...vV65",
    txHash: "0xZ3uU5vV65kk",
    amount: "520.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-07-19T14:40:10Z",
    createdAt: "2023-07-19T14:40:10Z",
  },
  {
    txID: 204,
    client: "A4wW6...xX66",
    txHash: "0xA4wW6xX66ll",
    amount: "43.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2023-07-24T16:55:00Z",
  },
  {
    txID: 205,
    client: "B5yY7...zZ67",
    txHash: "0xB5yY7zZ67mm",
    amount: "685.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-07-31T10:05:00Z",
    createdAt: "2023-07-31T10:05:00Z",
  },

  // August 2023 (5 payments)
  {
    txID: 206,
    client: "C6aA8...bB68",
    txHash: "0xC6aA8bB68nn",
    amount: "425.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-08-02T09:30:00Z",
    createdAt: "2023-08-02T09:30:00Z",
    updatedAt: "2023-08-02T09:35:00Z",
  },
  {
    txID: 207,
    client: "D7cC9...dD69",
    txHash: "0xD7cC9dD69oo",
    amount: "315.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2023-08-09T12:45:30Z",
  },
  {
    txID: 208,
    client: "E8eE0...fF70",
    txHash: "0xE8eE0fF70pp",
    amount: "610.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-08-16T15:20:10Z",
    createdAt: "2023-08-16T15:20:10Z",
  },
  {
    txID: 209,
    client: "F9gG1...hH71",
    txHash: "0xF9gG1hH71qq",
    amount: "37.50",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2023-08-21T18:10:00Z",
  },
  {
    txID: 210,
    client: "G0iI2...jJ72",
    txHash: "0xG0iI2jJ72rr",
    amount: "795.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-08-28T13:50:00Z",
    createdAt: "2023-08-28T13:50:00Z",
  },

  // September 2023 (5 payments)
  {
    txID: 211,
    client: "H1kK3...lL73",
    txHash: "0xH1kK3lL73ss",
    amount: "380.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-09-04T08:15:00Z",
    createdAt: "2023-09-04T08:15:00Z",
    updatedAt: "2023-09-04T08:20:00Z",
  },
  {
    txID: 212,
    client: "I2mM4...nN74",
    txHash: "0xI2mM4nN74tt",
    amount: "250.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2023-09-11T11:30:30Z",
  },
  {
    txID: 213,
    client: "J3oO5...pP75",
    txHash: "0xJ3oO5pP75uu",
    amount: "540.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-09-18T14:45:10Z",
    createdAt: "2023-09-18T14:45:10Z",
  },
  {
    txID: 214,
    client: "K4qQ6...rR76",
    txHash: "0xK4qQ6rR76vv",
    amount: "61.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2023-09-23T17:05:55Z",
  },
  {
    txID: 215,
    client: "L5sS7...tT77",
    txHash: "0xL5sS7tT77ww",
    amount: "920.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-09-30T12:20:00Z",
    createdAt: "2023-09-30T12:20:00Z",
  },

  // October 2023 (5 payments)
  {
    txID: 216,
    client: "M6uU8...vV78",
    txHash: "0xM6uU8vV78xx",
    amount: "465.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-10-03T10:00:00Z",
    createdAt: "2023-10-03T10:00:00Z",
    updatedAt: "2023-10-03T10:05:00Z",
  },
  {
    txID: 217,
    client: "N7wW9...xX79",
    txHash: "0xN7wW9xX79yy",
    amount: "285.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2023-10-10T13:15:30Z",
  },
  {
    txID: 218,
    client: "O8yY0...zZ80",
    txHash: "0xO8yY0zZ80zz",
    amount: "685.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-10-17T16:30:10Z",
    createdAt: "2023-10-17T16:30:10Z",
  },
  {
    txID: 219,
    client: "P9aA1...bB81",
    txHash: "0xP9aA1bB81aa",
    amount: "52.50",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2023-10-22T09:45:00Z",
  },
  {
    txID: 220,
    client: "Q0cC2...dD82",
    txHash: "0xQ0cC2dD82bb",
    amount: "850.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-10-29T14:55:00Z",
    createdAt: "2023-10-29T14:55:00Z",
  },

  // November 2023 (5 payments)
  {
    txID: 221,
    client: "R1eE3...fF83",
    txHash: "0xR1eE3fF83cc",
    amount: "390.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-11-05T09:20:00Z",
    createdAt: "2023-11-05T09:20:00Z",
    updatedAt: "2023-11-05T09:25:00Z",
  },
  {
    txID: 222,
    client: "S2gG4...hH84",
    txHash: "0xS2gG4hH84dd",
    amount: "225.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2023-11-12T12:40:30Z",
  },
  {
    txID: 223,
    client: "T3iI5...jJ85",
    txHash: "0xT3iI5jJ85ee",
    amount: "575.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-11-19T15:55:10Z",
    createdAt: "2023-11-19T15:55:10Z",
  },
  {
    txID: 224,
    client: "U4kK6...lL86",
    txHash: "0xU4kK6lL86ff",
    amount: "48.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2023-11-24T18:20:00Z",
  },
  {
    txID: 225,
    client: "V5mM7...nN87",
    txHash: "0xV5mM7nN87gg",
    amount: "960.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-11-30T11:30:00Z",
    createdAt: "2023-11-30T11:30:00Z",
  },

  // December 2023 (5 payments)
  {
    txID: 226,
    client: "W6oO8...pP88",
    txHash: "0xW6oO8pP88hh",
    amount: "480.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-12-02T08:50:00Z",
    createdAt: "2023-12-02T08:50:00Z",
    updatedAt: "2023-12-02T08:55:00Z",
  },
  {
    txID: 227,
    client: "X7qQ9...rR89",
    txHash: "0xX7qQ9rR89ii",
    amount: "340.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2023-12-09T13:05:30Z",
  },
  {
    txID: 228,
    client: "Y8sS0...tT90",
    txHash: "0xY8sS0tT90jj",
    amount: "720.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-12-16T16:20:10Z",
    createdAt: "2023-12-16T16:20:10Z",
  },
  {
    txID: 229,
    client: "Z9uU1...vV91",
    txHash: "0xZ9uU1vV91kk",
    amount: "55.50",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2023-12-21T09:40:00Z",
  },
  {
    txID: 230,
    client: "A0wW2...xX92",
    txHash: "0xA0wW2xX92ll",
    amount: "1095.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2023-12-28T14:30:00Z",
    createdAt: "2023-12-28T14:30:00Z",
  },

  // June 2025 (5 payments, at least one settled)
  {
    txID: 1,
    client: "C6uN9...bT12",
    txHash: "0xC6uN9bT12a",
    amount: "245.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2025-06-03T10:12:00Z",
    createdAt: "2025-06-03T10:12:00Z",
    updatedAt: "2025-06-03T10:20:00Z",
  },
  {
    txID: 2,
    client: "J2kL4...mN88",
    txHash: "0xJ2kL4mN88b",
    amount: "78.50",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2025-06-10T14:05:30Z",
  },
  {
    txID: 3,
    client: "Q9vR1...xA33",
    txHash: "0xQ9vR1xA33c",
    amount: "1200.00",
    endpoint: "/payments/settle",
    network: "bitcoin",
    asset: "BTC",
    status: "settled",
    time: "2025-06-18T08:45:10Z",
    createdAt: "2025-06-18T08:45:10Z",
  },
  {
    txID: 4,
    client: "Z3pT7...yL21",
    txHash: "0xZ3pT7yL21d",
    amount: "360.00",
    endpoint: "/invoices",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2025-06-22T19:30:00Z",
  },
  {
    txID: 5,
    client: "M5sV2...hK55",
    txHash: "0xM5sV2hK55e",
    amount: "49.99",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2025-06-29T12:00:00Z",
  },

  // July 2025 (5 payments)
  {
    txID: 6,
    client: "R7nW0...pD44",
    txHash: "0xR7nW0pD44f",
    amount: "520.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2025-07-02T09:15:00Z",
    createdAt: "2025-07-02T09:15:00Z",
    updatedAt: "2025-07-02T09:18:00Z",
  },
  {
    txID: 7,
    client: "T1aB6...qS66",
    txHash: "0xT1aB6qS66g",
    amount: "250.00",
    endpoint: "/payments",
    network: "solana",
    asset: "USDC",
    status: "pending",
    time: "2025-07-09T11:40:30Z",
  },
  {
    txID: 8,
    client: "U8cD3...zF99",
    txHash: "0xU8cD3zF99h",
    amount: "899.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2025-07-15T16:22:10Z",
    createdAt: "2025-07-15T16:22:10Z",
  },
  {
    txID: 9,
    client: "L4eF0...vB10",
    txHash: "0xL4eF0vB10i",
    amount: "39.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2025-07-20T07:05:55Z",
  },
  {
    txID: 10,
    client: "N6gH2...rQ77",
    txHash: "0xN6gH2rQ77j",
    amount: "65.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2025-07-28T21:10:00Z",
  },

  // August 2025 (5 payments)
  {
    txID: 11,
    client: "P9hJ5...kM88",
    txHash: "0xP9hJ5kM88k",
    amount: "1500.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2025-08-01T13:00:00Z",
    createdAt: "2025-08-01T13:00:00Z",
    updatedAt: "2025-08-01T13:05:00Z",
  },
  {
    txID: 12,
    client: "S2kL8...aV21",
    txHash: "0xS2kL8aV21l",
    amount: "320.00",
    endpoint: "/payments",
    network: "bitcoin",
    asset: "BTC",
    status: "pending",
    time: "2025-08-05T10:30:30Z",
  },
  {
    txID: 13,
    client: "W3lM9...nX33",
    txHash: "0xW3lM9nX33m",
    amount: "45.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2025-08-10T18:45:00Z",
  },
  {
    txID: 14,
    client: "D4oN1...tY44",
    txHash: "0xD4oN1tY44n",
    amount: "600.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2025-08-18T08:00:00Z",
    createdAt: "2025-08-18T08:00:00Z",
  },
  {
    txID: 15,
    client: "Y5pQ2...sZ55",
    txHash: "0xY5pQ2sZ55o",
    amount: "99.99",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2025-08-27T14:20:20Z",
  },

  // September 2025 (5 payments)
  {
    txID: 16,
    client: "F6rR3...uW66",
    txHash: "0xF6rR3uW66p",
    amount: "780.00",
    endpoint: "/payments/create",
    network: "solana",
    asset: "USDC",
    status: "settled",
    time: "2025-09-03T09:50:00Z",
    createdAt: "2025-09-03T09:50:00Z",
    updatedAt: "2025-09-03T09:55:00Z",
  },
  {
    txID: 17,
    client: "G7sS4...vV77",
    txHash: "0xG7sS4vV77q",
    amount: "210.00",
    endpoint: "/payments",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2025-09-10T12:12:12Z",
  },
  {
    txID: 18,
    client: "H8tT5...wU88",
    txHash: "0xH8tT5wU88r",
    amount: "44.50",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2025-09-14T16:16:16Z",
  },
  {
    txID: 19,
    client: "I9uU6...xT99",
    txHash: "0xI9uU6xT99s",
    amount: "1040.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2025-09-21T20:00:00Z",
    createdAt: "2025-09-21T20:00:00Z",
  },
  {
    txID: 20,
    client: "K0vV7...yS11",
    txHash: "0xK0vV7yS11t",
    amount: "59.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2025-09-28T07:07:07Z",
  },

  // October 2025 (5 payments)
  {
    txID: 21,
    client: "O1wW8...zR22",
    txHash: "0xO1wW8zR22u",
    amount: "230.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2025-10-04T11:11:11Z",
    createdAt: "2025-10-04T11:11:11Z",
    updatedAt: "2025-10-04T11:20:00Z",
  },
  {
    txID: 22,
    client: "B2xX9...aQ33",
    txHash: "0xB2xX9aQ33v",
    amount: "400.00",
    endpoint: "/payments",
    network: "bitcoin",
    asset: "BTC",
    status: "pending",
    time: "2025-10-10T13:13:13Z",
  },
  {
    txID: 23,
    client: "C3yY0...bP44",
    txHash: "0xC3yY0bP44w",
    amount: "675.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2025-10-16T15:15:15Z",
    createdAt: "2025-10-16T15:15:15Z",
  },
  {
    txID: 24,
    client: "D4zZ1...cO55",
    txHash: "0xD4zZ1cO55x",
    amount: "29.99",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2025-10-21T18:40:00Z",
  },
  {
    txID: 25,
    client: "E5aA2...dN66",
    txHash: "0xE5aA2dN66y",
    amount: "95.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2025-10-29T09:00:00Z",
  },

  // November 2025 (5 payments)
  {
    txID: 26,
    client: "V6bB3...eM77",
    txHash: "0xV6bB3eM77z",
    amount: "1999.00",
    endpoint: "/payments/create",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2025-11-01T08:00:00Z",
    createdAt: "2025-11-01T08:00:00Z",
    updatedAt: "2025-11-01T08:05:00Z",
  },
  {
    txID: 27,
    client: "X7cC4...fL88",
    txHash: "0xX7cC4fL88a",
    amount: "425.00",
    endpoint: "/payments",
    network: "solana",
    asset: "USDC",
    status: "pending",
    time: "2025-11-05T12:30:00Z",
  },
  {
    txID: 28,
    client: "Y8dD5...gK99",
    txHash: "0xY8dD5gK99b",
    amount: "550.00",
    endpoint: "/payments/settle",
    network: "ethereum",
    asset: "USDC",
    status: "settled",
    time: "2025-11-07T16:55:01Z",
    createdAt: "2025-11-07T16:55:01Z",
  },
  {
    txID: 29,
    client: "Z9eE6...hJ10",
    txHash: "0xZ9eE6hJ10c",
    amount: "75.00",
    endpoint: "/payments",
    network: null,
    asset: "USDC",
    status: "failed",
    time: "2025-11-08T09:45:00Z",
  },
  {
    txID: 30,
    client: "A0fF7...iI11",
    txHash: "0xA0fF7iI11d",
    amount: "150.00",
    endpoint: "/invoices",
    network: "ethereum",
    asset: "USDC",
    status: "pending",
    time: "2025-11-09T14:14:14Z",
  },
];

/**
 * Calculate total revenue from all settled transactions.
 */
function calculateTotalRevenue(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => {
    if (tx.status !== "settled") return sum;
    const raw =
      typeof tx.amount === "string"
        ? tx.amount.replace(/[^0-9.-]/g, "")
        : String(tx.amount);
    const num = parseFloat(raw);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
}

/**
 * Calculate YoY revenue change percentage.
 * Compares current year settled revenue to previous year settled revenue.
 */
function calculateRevenueChange(transactions: Transaction[]): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  const currentYearRevenue = transactions.reduce((sum, tx) => {
    if (tx.status !== "settled") return sum;
    const timeStr = tx.time ?? tx.createdAt ?? tx.updatedAt;
    if (!timeStr) return sum;
    const date = new Date(timeStr);
    if (isNaN(date.getTime()) || date.getFullYear() !== currentYear) return sum;
    const raw =
      typeof tx.amount === "string"
        ? tx.amount.replace(/[^0-9.-]/g, "")
        : String(tx.amount);
    const num = parseFloat(raw);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const previousYearRevenue = transactions.reduce((sum, tx) => {
    if (tx.status !== "settled") return sum;
    const timeStr = tx.time ?? tx.createdAt ?? tx.updatedAt;
    if (!timeStr) return sum;
    const date = new Date(timeStr);
    if (isNaN(date.getTime()) || date.getFullYear() !== previousYear)
      return sum;
    const raw =
      typeof tx.amount === "string"
        ? tx.amount.replace(/[^0-9.-]/g, "")
        : String(tx.amount);
    const num = parseFloat(raw);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  if (previousYearRevenue === 0) return 0;
  return Math.round(
    ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100
  );
}

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("1 Year");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);

  const router = useRouter();
  const { data: session } = useSession();

  // Effect: Redirect when accessing dashboard without session
  useEffect(() => {
    if (!session) {
      router.push("/");
    }
  }, [session, router]);

  // Load wallet balance
  useEffect(() => {
    const loadBalance = async () => {
      try {
        // Load USDC balance on devnet
        const usdcResult = await fetchBalance("solana-devnet");
        if (usdcResult.success && usdcResult.balance !== undefined) {
          setUsdcBalance(usdcResult.balance / 1_000_000);
        }
      } catch (err) {
        console.error("Failed to load balance:", err);
      }
    };

    if (session) {
      loadBalance();
      // Refresh every 30 seconds
      const interval = setInterval(loadBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const { publicKey, disconnect, connect, connected, wallet, select, wallets } = useWallet();

  // Detect wallet changes and log out if wallet address changes
  useEffect(() => {
    if (session && publicKey) {
      const sessionWallet = (session.user as any)?.walletAddress; // The wallet address from session
      const currentWallet = publicKey.toBase58();

      // If the connected wallet doesn't match the authenticated wallet, log out
      if (sessionWallet && sessionWallet !== currentWallet) {
        console.log("Wallet mismatch detected!");
        console.log("Session wallet:", sessionWallet);
        console.log("Current wallet:", currentWallet);
        console.log("Logging out...");
        disconnect();
        signOut({ redirect: true, callbackUrl: "/" });
      }
    }
  }, [session, publicKey, disconnect]);

  // Auto-reconnect wallet if disconnected but session exists
  useEffect(() => {
    const reconnectWallet = async () => {
      if (session && !connected) {
        // If no wallet is selected but wallets are available, select the first one
        if (!wallet && wallets.length > 0) {
          try {
            select(wallets[0].adapter.name);
          } catch (err) {
            console.error("Failed to select wallet:", err);
          }
        }

        // If wallet is selected but not connected, try to connect
        if (wallet) {
          try {
            await connect();
          } catch (err) {
            console.error("Failed to reconnect wallet:", err);
          }
        }
      }
    };

    reconnectWallet();
  }, [session, connected, wallet, wallets, connect, select]);

  const { data, error: transactionsError } = useSWR(
    "transactions",
    () => fetchTransactions(20, 0),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );
  const transactions = data?.length ? data : defaultPayments;

  const totalRevenue = calculateTotalRevenue(defaultPayments);
  const revenueChange = calculateRevenueChange(defaultPayments);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white container mx-auto">
      {/* Header */}
      <header className="border-b border-zinc-800/50 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="hidden md:flex items-center gap-2 bg-zinc-900/50 rounded-lg px-3 py-2 border border-zinc-800/50">
            <Image
              src="/solana.png"
              alt="Solana Logo"
              width={30}
              height={30}
              className="rounded-full"
            />
            <span className="text-sm font-mono">
              {publicKey
                ? (() => {
                    const pk = publicKey.toBase58();
                    return `${pk.slice(0, 9)}...${pk.slice(-4)}`;
                  })()
                : ""}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={async () => {
                disconnect();
                await signOut({ redirect: true, callbackUrl: "/" });
              }}
              aria-label="Sign out"
              className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:px-6 lg:px-8 pb-24 md:pb-8">
        {/* Mobile Header Section */}
        <div className="md:hidden mb-6">
          <h1 className="text-4xl font-bold mb-1">Home</h1>
        </div>

        {/* Revenue Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm text-zinc-400 mb-2">Total Revenue</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl md:text-6xl font-bold">
                  ${totalRevenue.toLocaleString()}
                </span>
                <div
                  className={`flex items-center gap-1 text-sm md:text-base ${
                    revenueChange >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {revenueChange >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{Math.abs(revenueChange)}% (Year)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              {/* Balance Display */}
              <div className="bg-zinc-900/50 rounded-2xl px-4 py-2 border border-zinc-800/50">
                <div className="text-xs text-zinc-400 mb-1">Available Balance</div>
                <div className="text-2xl font-bold">${usdcBalance.toFixed(2)} USDC</div>
              </div>

              <Button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="bg-zinc-800/80 hover:bg-zinc-700 text-white border border-zinc-700/50 gap-2 rounded-full px-6"
              >
                <Upload className="w-4 h-4" />
                withdraw
              </Button>
            </div>
          </div>

          {/* Time Period Selector - Mobile */}
          <div className="md:hidden flex gap-2 mb-6 overflow-x-auto">
            {["24h", "7d", "30d", "1 Year"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedPeriod === period
                    ? "bg-zinc-800 text-white"
                    : "bg-transparent text-zinc-400 hover:text-white"
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Chart */}
          <RevenueChart transactions={defaultPayments} />
        </div>

        {/* Desktop Layout: Payments and Endpoints side by side */}
        <div className="hidden md:flex gap-8 mb-8">
          <PaymentsTable transactions={transactions || defaultPayments} />
          <EndpointsTable />
        </div>

        {/* Mobile Layout: Stacked */}
        <div className="md:hidden space-y-8">
          <EndpointsTable />
          <PaymentsTable transactions={transactions || defaultPayments} />
        </div>
      </main>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />
    </div>
  );
}
