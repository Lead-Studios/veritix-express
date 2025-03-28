import { AppDataSource } from "../config/database"
import { Between, MoreThanOrEqual } from "typeorm"
import { type GetUsersQueryDto, type GetUserReportsQueryDto, TimeFilter } from "../dtos/user.dto"
import { User } from "../model/user.entity"

export class UserService {
  private userRepository = AppDataSource.getRepository(User)

  async getAllUsers(queryParams: GetUsersQueryDto) {
    const { search, sortBy = "createdAt", sortOrder = "DESC", page = 1, limit = 10 } = queryParams

    const skip = (page - 1) * limit

    const queryBuilder = this.userRepository.createQueryBuilder("user")

    // Apply search if provided
    if (search) {
      queryBuilder.where("user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search", {
        search: `%${search}%`,
      })
    }

    // Apply sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder as "ASC" | "DESC")

    // Apply pagination
    queryBuilder.skip(skip).take(limit)

    // Get results and count
    const [users, total] = await queryBuilder.getManyAndCount()

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({ where: { id: String(id) } })

    if (!user) {
      throw new Error("User not found")
    }

    return user
  }

  async generateUserReports(queryParams: GetUserReportsQueryDto) {
    const { timeFilter, startDate, endDate } = queryParams

    // Set default date range based on timeFilter if not provided
    let dateFilter: any = {}
    const now = new Date()

    if (startDate && endDate) {
      dateFilter = {
        createdAt: Between(startDate, endDate),
      }
    } else {
      switch (timeFilter) {
        case TimeFilter.WEEK:
          // Last 7 days
          const lastWeek = new Date(now)
          lastWeek.setDate(lastWeek.getDate() - 7)
          dateFilter = {
            createdAt: MoreThanOrEqual(lastWeek),
          }
          break
        case TimeFilter.MONTH:
          // Last 30 days
          const lastMonth = new Date(now)
          lastMonth.setDate(lastMonth.getDate() - 30)
          dateFilter = {
            createdAt: MoreThanOrEqual(lastMonth),
          }
          break
        case TimeFilter.YEAR:
          // Last 365 days
          const lastYear = new Date(now)
          lastYear.setDate(lastYear.getDate() - 365)
          dateFilter = {
            createdAt: MoreThanOrEqual(lastYear),
          }
          break
        default:
          // Default to all time
          break
      }
    }

    // Get total users
    const totalUsers = await this.userRepository.count()

    // Get new users in the selected time period
    const newUsers = await this.userRepository.count({
      where: dateFilter,
    })

    // Get active users (users who logged in during the period)
    const activeUsers = await this.userRepository.count({
      where: {
        ...dateFilter,
        isActive: true,
      },
    })

    // Get verified users
    const verifiedUsers = await this.userRepository.count({
      where: {
        ...dateFilter,
        isVerified: true,
      },
    })

    // Get user growth by time period
    let userGrowth:any = []

    if (timeFilter === TimeFilter.WEEK) {
      // Daily growth for the last week
      userGrowth = await this.getUserGrowthByDay(7)
    } else if (timeFilter === TimeFilter.MONTH) {
      // Weekly growth for the last month
      userGrowth = await this.getUserGrowthByWeek(4)
    } else if (timeFilter === TimeFilter.YEAR) {
      // Monthly growth for the last year
      userGrowth = await this.getUserGrowthByMonth(12)
    }

    return {
      summary: {
        totalUsers,
        newUsers,
        activeUsers,
        verifiedUsers,
        timeFilter,
      },
      userGrowth,
    }
  }

  private async getUserGrowthByDay(days: number) {
    const result = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const count = await this.userRepository.count({
        where: {
          createdAt: Between(date, nextDate),
        },
      })

      result.push({
        date: date.toISOString().split("T")[0],
        count,
      })
    }

    return result
  }

  private async getUserGrowthByWeek(weeks: number) {
    const result = []
    const now = new Date()

    for (let i = weeks - 1; i >= 0; i--) {
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - i * 7 - 6)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() - i * 7)
      endDate.setHours(23, 59, 59, 999)

      const count = await this.userRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
        },
      })

      result.push({
        weekStart: startDate.toISOString().split("T")[0],
        weekEnd: endDate.toISOString().split("T")[0],
        count,
      })
    }

    return result
  }

  private async getUserGrowthByMonth(months: number) {
    const result = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      date.setDate(1)
      date.setHours(0, 0, 0, 0)

      const nextMonth = new Date(date)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      const count = await this.userRepository.count({
        where: {
          createdAt: Between(date, nextMonth),
        },
      })

      result.push({
        month: date.toISOString().split("T")[0].substring(0, 7),
        count,
      })
    }

    return result
  }
}

